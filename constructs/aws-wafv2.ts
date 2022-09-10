import { Construct } from 'constructs';
import { wafv2 } from '@cdktf/provider-aws';

export interface AwsWafv2WebAclProps {
  readonly name: string;
}

export class AwsWafv2 extends Construct {
  public readonly webAcl: wafv2.Wafv2WebAcl;
  constructor(scope: Construct, id: string, props: AwsWafv2WebAclProps) {
    super(scope, id);

    const { name } = props;

    this.webAcl = new wafv2.Wafv2WebAcl(this, 'web-acl', {
      name: name,
      description: 'web-acl',
      scope: 'CLOUDFRONT',
      defaultAction: {
        allow: {},
      },
      rule: [
        {
          name: 'rule-1',
          priority: 1,
          overrideAction: {
            count: {},
          },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesCommonRuleSet',
              vendorName: 'AWS',
            },
          },
          visibilityConfig: {
            cloudwatchMetricsEnabled: false,
            metricName: 'web-acl-rule-1',
            sampledRequestsEnabled: false,
          },
        },
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: false,
        metricName: 'web-acl',
        sampledRequestsEnabled: false,
      },
    });
  }
}
