import { Construct } from 'constructs';
import { ses } from '@cdktf/provider-aws';
import { AwsRoute53 } from './aws-route53';
import { Fn } from 'cdktf';

export interface AwsSesProps {
  readonly domain: string;
  readonly route53: AwsRoute53;
}

export class AwsSes extends Construct {
  public readonly domain: ses.SesDomainIdentity;
  constructor(scope: Construct, id: string, props: AwsSesProps) {
    super(scope, id);

    const { domain, route53 } = props;
    let count = 0;

    this.domain = new ses.SesDomainIdentity(this, 'domain-identity', {
      domain,
    });

    route53.addRoute53Record(
      {
        name: `mail.${domain}`,
        type: 'TXT',
        ttl: 600,
        records: [this.domain.verificationToken],
      },
      'ses',
      count,
    );
    count++;

    const dkimRecord = new ses.SesDomainDkim(this, 'domain-dkim', {
      domain: this.domain.id,
    });

    for (let num = 0; num < 3; num++) {
      route53.addRoute53Record(
        {
          name: `${Fn.element(dkimRecord.dkimTokens, num)}._domainkey.${domain}`,
          type: 'CNAME',
          ttl: 600,
          records: [`${Fn.element(dkimRecord.dkimTokens, num)}.dkim.amazonses.com`],
        },
        'ses',
        count,
      );
      count++;
    }

    new ses.SesDomainIdentityVerification(this, 'domain-identity-verification', {
      domain: this.domain.id,
    });
  }
}
