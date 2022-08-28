import { Construct } from 'constructs';
import { apigateway } from '@cdktf/provider-aws';

interface IEndpointConfiguration {
  readonly types: string[];
}

export interface AwsApiGatewayProps {
  readonly name: string;
  readonly description?: string;
  readonly endpointConfiguration?: IEndpointConfiguration;
}

export class AwsApiGateway extends Construct {
  public readonly api: apigateway.ApiGatewayRestApi;
  public readonly root: apigateway.ApiGatewayMethod;

  constructor(scope: Construct, id: string, props: AwsApiGatewayProps) {
    super(scope, id);
    const { name, description, endpointConfiguration } = props;
    this.api = new apigateway.ApiGatewayRestApi(this, `${name}-rest-api`, {
      name: name,
      description: description || '',
      endpointConfiguration: endpointConfiguration || {
        types: ['REGIONAL'],
      },
    });
    this.root = new apigateway.ApiGatewayMethod(this, `${name}-root`, {
      restApiId: this.api.id,
      resourceId: this.api.rootResourceId,
      httpMethod: 'ANY',
      authorization: 'NONE',
    });
  }
}
