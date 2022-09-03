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
  public readonly apiGatewayResource: (
    name: string,
    parentId: string,
    pathPart: string,
  ) => apigateway.ApiGatewayResource;
  public readonly apiGatewayMethod: (
    name: string,
    resource: apigateway.ApiGatewayResource,
    httpMethod: string,
    authorization?: string,
  ) => apigateway.ApiGatewayMethod;
  public readonly apiGatewayIntegration: (
    name: string,
    resource: apigateway.ApiGatewayResource,
    httpMethod: string,
    uri: string,
  ) => apigateway.ApiGatewayIntegration;
  public readonly apiGatewayDeployment: (
    name: string,
    stageName: string,
  ) => apigateway.ApiGatewayDeployment;

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

    this.apiGatewayResource = (name: string, parentId: string, pathPart: string) => {
      return new apigateway.ApiGatewayResource(this, `${name}-resource`, {
        restApiId: this.api.id,
        parentId: parentId,
        pathPart: pathPart,
      });
    };

    this.apiGatewayMethod = (
      name: string,
      resource: apigateway.ApiGatewayResource,
      httpMethod: string,
      authorization?: string,
    ) => {
      return new apigateway.ApiGatewayMethod(this, `${name}-method`, {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: httpMethod,
        authorization: authorization || 'NONE',
      });
    };

    this.apiGatewayIntegration = (
      name: string,
      resource: apigateway.ApiGatewayResource,
      httpMethod: string,
      uri: string,
    ) => {
      return new apigateway.ApiGatewayIntegration(this, `${name}-integration`, {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: uri,
      });
    };

    this.apiGatewayDeployment = (name: string, stageName: string) => {
      return new apigateway.ApiGatewayDeployment(this, `${name}-deployment`, {
        restApiId: this.api.id,
        stageName: stageName,
      });
    };
  }
}
