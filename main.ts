import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider, apigateway } from '@cdktf/provider-aws';
import { AwsOnDemndDynamodb, AwsApiGateway } from './constructs';

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    new AwsOnDemndDynamodb(this, 'aws-ondemand-dynamodb', {
      name: 'my-ondemand-dynamodb',
      hashKey: 'uuid',
      rangeKey: 'h_hkid',
      attributes: [
        { name: 'uuid', type: 'S' },
        { name: 'h_hkid', type: 'S' },
      ],
    });

    const api = new AwsApiGateway(this, 'aws-apigateway', {
      name: 'my-rest-api',
      description: 'My REST API',
    });

    new apigateway.ApiGatewayDeployment(this, 'aws-apigateway-deployment', {
      restApiId: api.api.id,
    });
  }
}

const app = new App();
new MyStack(app, 'security');
app.synth();
