import { Construct } from 'constructs';
import { iam } from '@cdktf/provider-aws';

export interface AwsIamRoleProps {
  readonly name: string;
  readonly assumeRolePolicy: string;
  readonly description?: string;
  readonly managedPolicyArns?: string[];
  readonly inlinePolicy?: iam.IamRoleInlinePolicy[];
  readonly tags?: { [key: string]: string };
}

export class AwsIamRole extends Construct {
  public readonly role: iam.IamRole;

  constructor(scope: Construct, id: string, props: AwsIamRoleProps) {
    super(scope, id);

    const { name, assumeRolePolicy, description, managedPolicyArns, inlinePolicy, tags } = props;
    this.role = new iam.IamRole(this, `${name}-role`, {
      name: name,
      assumeRolePolicy: assumeRolePolicy,
      description: description || '',
      managedPolicyArns: managedPolicyArns || [],
      inlinePolicy: inlinePolicy || [],
      tags: tags || {},
    });
  }
}
