import { Construct } from 'constructs';
import { cloudfront } from '@cdktf/provider-aws';

export interface AwsCloudFrontProps {
  readonly enabled: boolean;
  readonly defaultCacheBehavior: cloudfront.CloudfrontDistributionDefaultCacheBehavior;
  readonly origin: cloudfront.CloudfrontDistributionOrigin[];
  readonly restrictions: cloudfront.CloudfrontDistributionRestrictions;
  readonly viewerCertificate: cloudfront.CloudfrontDistributionViewerCertificate;
  readonly priceClass: 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';
  readonly tags?: { [key: string]: string };
}

export class AwsCloudfront extends Construct {
  constructor(scope: Construct, id: string, props: AwsCloudFrontProps) {
    super(scope, id);

    const {
      enabled,
      defaultCacheBehavior,
      origin,
      restrictions,
      viewerCertificate,
      priceClass,
      tags,
    } = props;

    new cloudfront.CloudfrontDistribution(this, 'distribution', {
      enabled,
      defaultCacheBehavior,
      origin,
      restrictions,
      viewerCertificate,
      priceClass,
      tags: tags || {},
    });
  }
}
