// infra/lib/backend-stack.ts — ECR + ECS Fargate + ALB + Route53
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as logs from 'aws-cdk-lib/aws-logs'
import { Construct } from 'constructs'
import { EnvConfig } from './config'

interface BackendStackProps extends cdk.StackProps {
  config: EnvConfig
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props)
    const { config } = props

    // ECR repository (created externally, shared across environments)
    const repository = ecr.Repository.fromRepositoryName(this, 'Repo', 'breathe-api')

    // VPC
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: config.enableNat ? 1 : 0,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        ...(config.enableNat ? [{
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        }] : []),
      ],
    })

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `breathe-${config.envName}`,
      vpc,
    })

    // Secrets Manager — reference existing secret
    const appSecrets = secretsmanager.Secret.fromSecretNameV2(
      this, 'AppSecrets', `breathe/${config.envName}/app`
    )

    // Route53 hosted zone
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: config.hostedZoneName,
    })

    // ACM certificate for API domain
    const certificate = new acm.Certificate(this, 'ApiCert', {
      domainName: config.apiDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    })

    // Task definition
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: config.vCpu,
      memoryLimitMiB: config.memoryMiB,
    })

    const container = taskDef.addContainer('api', {
      image: ecs.ContainerImage.fromEcrRepository(
        ecr.Repository.fromRepositoryName(this, 'ApiRepo', 'breathe-api'),
        `${config.envName}-latest`
      ),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'breathe-api',
        logRetention: config.envName === 'dev' ? logs.RetentionDays.ONE_WEEK : logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        NODE_ENV: 'production',
        CORS_ORIGIN: config.envName === 'prd'
          ? 'https://breathecalm.es'
          : 'https://dev.breathecalm.es',
      },
      secrets: {
        NEXT_PUBLIC_SUPABASE_URL: ecs.Secret.fromSecretsManager(appSecrets, 'NEXT_PUBLIC_SUPABASE_URL'),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ecs.Secret.fromSecretsManager(appSecrets, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        SUPABASE_SERVICE_ROLE_KEY: ecs.Secret.fromSecretsManager(appSecrets, 'SUPABASE_SERVICE_ROLE_KEY'),
        ADMIN_SECRET: ecs.Secret.fromSecretsManager(appSecrets, 'ADMIN_SECRET'),
        S3_ACCESS_KEY_ID: ecs.Secret.fromSecretsManager(appSecrets, 'S3_ACCESS_KEY_ID'),
        S3_SECRET_ACCESS_KEY: ecs.Secret.fromSecretsManager(appSecrets, 'S3_SECRET_ACCESS_KEY'),
        S3_UPLOAD_BUCKET: ecs.Secret.fromSecretsManager(appSecrets, 'S3_UPLOAD_BUCKET'),
        S3_UPLOAD_REGION: ecs.Secret.fromSecretsManager(appSecrets, 'S3_UPLOAD_REGION'),
      },
      portMappings: [{ containerPort: 3000 }],
    })

    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
    })

    // ECS Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      serviceName: `breathe-api-${config.envName}`,
      taskDefinition: taskDef,
      desiredCount: config.desiredCount,
      assignPublicIp: !config.enableNat, // public IP if no NAT
      vpcSubnets: {
        subnetType: config.enableNat ? ec2.SubnetType.PRIVATE_WITH_EGRESS : ec2.SubnetType.PUBLIC,
      },
    })

    // HTTPS listener
    const listener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
    })

    listener.addTargets('EcsTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/api/blog',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    })

    // HTTP → HTTPS redirect
    alb.addListener('HttpRedirect', {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    })

    // Auto-scaling (PRD only)
    if (config.enableAutoScaling) {
      const scaling = service.autoScaleTaskCount({
        minCapacity: config.minCapacity,
        maxCapacity: config.maxCapacity,
      })
      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      })
    }

    // Route53 A record → ALB
    new route53.ARecord(this, 'ApiAliasRecord', {
      zone,
      recordName: config.apiDomain,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
    })

    // Outputs
    new cdk.CfnOutput(this, 'ALBDnsName', { value: alb.loadBalancerDnsName })
    new cdk.CfnOutput(this, 'ApiDomain', { value: config.apiDomain })
    new cdk.CfnOutput(this, 'ClusterName', { value: cluster.clusterName })
    new cdk.CfnOutput(this, 'ServiceName', { value: service.serviceName })
  }
}
