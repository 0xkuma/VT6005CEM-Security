import { Construct } from 'constructs';
import { cloudfront, datasources, s3 } from '@cdktf/provider-aws';

export interface AwsCloudFrontProps {
  readonly enabled: boolean;
  readonly defaultRootObject: string;
  readonly defaultCacheBehavior: cloudfront.CloudfrontDistributionDefaultCacheBehavior;
  readonly origin: cloudfront.CloudfrontDistributionOrigin[];
  readonly restrictions: cloudfront.CloudfrontDistributionRestrictions;
  readonly viewerCertificate: cloudfront.CloudfrontDistributionViewerCertificate;
  readonly priceClass: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';
  readonly tags?: { [key: string]: string };
  // readonly route53: cloudfront.CloudfrontDistribution;
  readonly bucket: s3.S3Bucket;
}

export class AwsCloudfront extends Construct {
  public readonly distribution: cloudfront.CloudfrontDistribution;
  constructor(scope: Construct, id: string, props: AwsCloudFrontProps) {
    super(scope, id);

    const {
      enabled,
      defaultRootObject,
      defaultCacheBehavior,
      restrictions,
      viewerCertificate,
      priceClass,
      tags,
      bucket,
    } = props;

    const accountId = new datasources.DataAwsCallerIdentity(scope, 'account-id').accountId;

    const oai = new cloudfront.CloudfrontOriginAccessIdentity(this, 'origin-access-identity', {});
    new s3.S3BucketPolicy(this, 'bucket-policy', {
      bucket: bucket.id,
      policy: `{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowCloudFrontServicePrincipalReadOnly",
                "Effect": "Allow",
                "Principal": {
                    "Service": "cloudfront.amazonaws.com"
                },
                "Action": "s3:GetObject",
                "Resource": "${bucket.arn}/*",
                "Condition": {
                    "StringEquals": {
                        "AWS:SourceArn": "arn:aws:cloudfront::${accountId}:distribution/${oai.id}"
                    }
                }
            },
            {
                "Sid": "AllowLegacyOAIReadOnly",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${oai.id}"
                },
                "Action": "s3:GetObject",
                "Resource": "${bucket.arn}/*"
            }
        ]
      }`,
    });

    const origin = props.origin.map((o) => ({
      ...o,
      s3OriginConfig: {
        originAccessIdentity: oai.cloudfrontAccessIdentityPath,
      },
    }));

    this.distribution = new cloudfront.CloudfrontDistribution(this, 'distribution', {
      enabled,
      defaultRootObject,
      defaultCacheBehavior,
      origin,
      restrictions,
      viewerCertificate,
      priceClass,
      tags: tags || {},
    });
  }
}
