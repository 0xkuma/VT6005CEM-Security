import { Construct } from 'constructs';
import { acm } from '@cdktf/provider-aws';
import { AwsRoute53 } from './aws-route53';
// import { TerraformOutput } from 'cdktf';

export interface AcmCertificateProps {
  readonly domainName: string;
  readonly validationMethod: 'DNS' | 'EMAIL';
  readonly route53: AwsRoute53;
}

export class AwsAcmCertificate extends Construct {
  public readonly certificate: acm.AcmCertificate;

  constructor(scope: Construct, id: string, props: AcmCertificateProps) {
    super(scope, id);

    const { domainName, validationMethod, route53 } = props;

    this.certificate = new acm.AcmCertificate(this, 'certificate', {
      domainName: domainName,
      validationMethod: validationMethod,
    });

    const dvo = this.certificate.domainValidationOptions.get(0);

    route53.addRoute53Record(
      {
        name: dvo.resourceRecordName,
        type: 'CNAME',
        ttl: 60,
        records: [dvo.resourceRecordValue],
      },
      'acm',
      '0',
    );

    new acm.AcmCertificateValidation(this, 'certificate-validation', {
      certificateArn: this.certificate.arn,
    });
  }
}
