// infra/lib/frontend-stack.ts — S3 + CloudFront + Route53
import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import { Construct } from 'constructs'
import { EnvConfig } from './config'

interface FrontendStackProps extends cdk.StackProps {
  config: EnvConfig
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props)
    const { config } = props

    // S3 bucket — block all public access, served only via CloudFront OAI
    const bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `breathecalm-frontend-${config.envName}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: config.envName === 'dev' ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: config.envName === 'dev',
    })

    // Route53 hosted zone (must already exist)
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: config.hostedZoneName,
    })

    // ACM certificate in us-east-1 (required for CloudFront)
    const certificate = new acm.DnsValidatedCertificate(this, 'Cert', {
      domainName: config.domain,
      hostedZone: zone,
      region: 'us-east-1',
    })

    // CloudFront Function — rewrite URLs for Next.js static export
    // /admin/login → /admin/login/index.html (trailingSlash: true generates /page/index.html)
    const urlRewriteFn = new cloudfront.Function(this, 'UrlRewrite', {
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If URI has a file extension, serve as-is (JS, CSS, images, etc.)
  if (uri.includes('.')) {
    return request;
  }

  // Append trailing slash if missing, then index.html
  if (!uri.endsWith('/')) {
    uri += '/';
  }
  request.uri = uri + 'index.html';

  return request;
}
      `),
      functionName: `breathe-url-rewrite-${config.envName}`,
    })

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [{
          function: urlRewriteFn,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      },
      domainNames: [config.domain],
      certificate,
      defaultRootObject: 'index.html',
    })

    // Route53 A record → CloudFront
    new route53.ARecord(this, 'AliasRecord', {
      zone,
      recordName: config.domain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
    })

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName })
    new cdk.CfnOutput(this, 'DistributionId', { value: distribution.distributionId })
    new cdk.CfnOutput(this, 'DomainName', { value: config.domain })
  }
}
