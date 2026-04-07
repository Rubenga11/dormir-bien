// infra/lib/backend-stack.ts — ECR + ECS Fargate + ALB + RDS PostgreSQL + Route53
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
import * as rds from 'aws-cdk-lib/aws-rds'
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

    // VPC — always create private subnets for RDS (isolated)
    const subnetConfig: ec2.SubnetConfiguration[] = [
      { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
    ]
    if (config.enableNat) {
      subnetConfig.push({ name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 })
    }
    // Isolated subnets for RDS (no internet access needed)
    subnetConfig.push({ name: 'db', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 })

    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: config.enableNat ? 1 : 0,
      subnetConfiguration: subnetConfig,
    })

    // ── RDS PostgreSQL ──

    // Security group for RDS
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc,
      description: 'Allow ECS tasks to connect to RDS PostgreSQL',
      allowAllOutbound: false,
    })

    // RDS credentials (auto-generated, stored in Secrets Manager)
    const dbCredentials = rds.Credentials.fromGeneratedSecret('breathe_admin', {
      secretName: `breathe/${config.envName}/db-credentials`,
    })

    const dbInstance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16_6 }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        config.dbInstanceClass === 't3.micro' ? ec2.InstanceSize.MICRO : ec2.InstanceSize.SMALL,
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      credentials: dbCredentials,
      databaseName: 'breathe',
      allocatedStorage: config.dbAllocatedStorageGiB,
      maxAllocatedStorage: config.dbAllocatedStorageGiB * 2,
      backupRetention: cdk.Duration.days(config.dbBackupRetentionDays),
      deletionProtection: config.envName === 'prd',
      removalPolicy: config.envName === 'prd' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      multiAz: false,
      storageEncrypted: true,
      publiclyAccessible: false,
    })

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `breathe-${config.envName}`,
      vpc,
    })

    // Secrets Manager — reference existing secret for app config
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

    // Build DATABASE_URL from RDS secret fields
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
        DB_SSL: 'true',
      },
      secrets: {
        // RDS credentials
        DB_HOST: ecs.Secret.fromSecretsManager(dbInstance.secret!, 'host'),
        DB_PORT: ecs.Secret.fromSecretsManager(dbInstance.secret!, 'port'),
        DB_NAME: ecs.Secret.fromSecretsManager(dbInstance.secret!, 'dbname'),
        DB_USER: ecs.Secret.fromSecretsManager(dbInstance.secret!, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbInstance.secret!, 'password'),
        // App secrets
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
      assignPublicIp: !config.enableNat,
      vpcSubnets: {
        subnetType: config.enableNat ? ec2.SubnetType.PRIVATE_WITH_EGRESS : ec2.SubnetType.PUBLIC,
      },
    })

    // Allow ECS tasks to connect to RDS
    dbSg.addIngressRule(
      service.connections.securityGroups[0],
      ec2.Port.tcp(5432),
      'Allow ECS tasks to connect to PostgreSQL'
    )

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
    new cdk.CfnOutput(this, 'DbEndpoint', { value: dbInstance.instanceEndpoint.hostname })
  }
}
