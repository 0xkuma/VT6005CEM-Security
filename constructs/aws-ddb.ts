import { Construct } from 'constructs';
import { dynamodb } from '@cdktf/provider-aws';

interface IAttributes {
  name: string;
  type: string;
}

export interface AwsDynamodbProps {
  readonly name: string;
  readonly readCapacity?: number;
  readonly writeCapacity?: number;
  readonly hashKey: string;
  readonly rangeKey?: string;
  readonly attributes: IAttributes[];
}

export class AwsProvisionedDynamodb extends Construct {
  constructor(scope: Construct, id: string, props: AwsDynamodbProps) {
    super(scope, id);

    const { name, readCapacity, writeCapacity, hashKey, rangeKey, attributes } = props;

    new dynamodb.DynamodbTable(this, `${name}-table`, {
      name: name,
      billingMode: 'PROVISIONED',
      readCapacity: readCapacity || 1,
      writeCapacity: writeCapacity || 1,
      hashKey: hashKey,
      rangeKey: rangeKey,
      attribute: attributes,
    });
  }
}

export class AwsOnDemndDynamodb extends Construct {
  constructor(scope: Construct, id: string, props: AwsDynamodbProps) {
    super(scope, id);

    const { name, hashKey, rangeKey, attributes } = props;

    new dynamodb.DynamodbTable(this, `${name}-table`, {
      name: name,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: hashKey,
      rangeKey: rangeKey,
      attribute: attributes,
    });
  }
}
