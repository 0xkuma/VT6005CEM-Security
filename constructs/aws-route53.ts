import { Construct } from 'constructs';
import { route53 } from '@cdktf/provider-aws';

interface IRecordSet {
  readonly name: string;
  readonly type: string;
  readonly ttl: number;
  readonly records: string[];
}

export interface AwsRoute53Props {
  readonly name: string;
  readonly records: IRecordSet[];
  readonly tags?: { [key: string]: string };
}

export class AwsRoute53 extends Construct {
  public readonly zone: route53.Route53Zone;

  constructor(scope: Construct, id: string, props: AwsRoute53Props) {
    super(scope, id);

    const { name, records, tags } = props;

    this.zone = new route53.Route53Zone(this, 'zone', {
      name: name,
      tags: tags || {},
    });

    for (let record of records) {
      switch (record.type) {
        case 'A':
          new route53.Route53Record(this, `${record.records}-${record.name}-recordSet`, {
            zoneId: this.zone.id,
            name: record.name,
            type: 'A',
            ttl: 60,
            records: record.records,
          });
          break;
        case 'CNAME':
          new route53.Route53Record(this, `${record.records}-${record.name}-recordSet`, {
            zoneId: this.zone.id,
            name: record.name,
            type: 'CNAME',
            ttl: 60,
            records: record.records,
          });
          break;
      }
    }
  }
}
