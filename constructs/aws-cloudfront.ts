import { Construct } from 'constructs';
import { cloudfront } from '@cdktf/provider-aws';

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
}

export class AwsCloudfront extends Construct {
  constructor(scope: Construct, id: string, props: AwsCloudFrontProps) {
    super(scope, id);

    const {
      enabled,
      defaultRootObject,
      defaultCacheBehavior,
      origin,
      restrictions,
      viewerCertificate,
      priceClass,
      tags,
    } = props;

    new cloudfront.CloudfrontDistribution(this, 'distribution', {
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
