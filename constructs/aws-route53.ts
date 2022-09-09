import { Construct } from 'constructs';
import { route53 } from '@cdktf/provider-aws';

interface IRecordSet {
  readonly name: string;
  readonly type: string;
  readonly ttl: number;
  readonly records?: string[];
}

export interface AwsRoute53Props {
  readonly name: string;
  readonly records: IRecordSet[];
  readonly forceDestroy?: boolean;
  readonly tags?: { [key: string]: string };
}

export class AwsRoute53 extends Construct {
  public readonly zone: route53.Route53Zone;
  public readonly addRoute53Record: (
    record: IRecordSet,
    resource: string,
    num: number | string,
  ) => void;

  constructor(scope: Construct, id: string, props: AwsRoute53Props) {
    super(scope, id);

    const { name, records, forceDestroy, tags } = props;

    this.addRoute53Record = (record: IRecordSet, resource: string, num: number | string) => {
      new route53.Route53Record(this, `${resource}-${record.type}-recordSet-${num}`, {
        zoneId: this.zone.zoneId,
        name: record.name,
        type: record.type,
        ttl: record.ttl,
        records: record.records,
      });
    };

    this.zone = new route53.Route53Zone(this, 'zone', {
      name: name,
      forceDestroy: forceDestroy || false,
      tags: tags || {},
    });

    for (let record in records) {
      this.addRoute53Record(records[record], 'route53', record);
    }
  }
}
