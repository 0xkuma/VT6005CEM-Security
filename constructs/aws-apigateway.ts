import { Construct } from 'constructs';
import { apigateway } from '@cdktf/provider-aws';
import { AwsAcmCertificate } from './aws-acm';
import { AwsRoute53 } from './aws-route53';

interface IEndpointConfiguration {
  readonly types: string[];
}

export interface AwsApiGatewayProps {
  readonly name: string;
  readonly description?: string;
  readonly endpointConfiguration?: IEndpointConfiguration;
  readonly domanName: string;
  readonly aws_acm: AwsAcmCertificate;
  readonly aws_route53: AwsRoute53;
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
    type: string,
  ) => apigateway.ApiGatewayIntegration;
  public readonly apiGatewayDeployment: (
    name: string,
    stageName: string,
  ) => apigateway.ApiGatewayDeployment;

  constructor(scope: Construct, id: string, props: AwsApiGatewayProps) {
    super(scope, id);
    const { name, description, endpointConfiguration, domanName, aws_acm, aws_route53 } = props;

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

    const apiDomainName = new apigateway.ApiGatewayDomainName(this, `${name}-domain-name`, {
      certificateArn: aws_acm.certificate.arn,
      domainName: `api.${domanName}`,
    });

    aws_route53.addRoute53Record(
      {
        name: apiDomainName.domainName,
        type: 'CNAME',
        ttl: 60,
        records: [apiDomainName.cloudfrontDomainName],
      },
      'api-gateway',
      '0',
    );

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
      type: string,
    ) => {
      return new apigateway.ApiGatewayIntegration(this, `${name}-integration`, {
        restApiId: this.api.id,
        resourceId: resource.id,
        httpMethod: httpMethod,
        integrationHttpMethod: 'POST',
        uri: uri,
        type: type,
      });
    };

    this.apiGatewayDeployment = (name: string, stageName: string) => {
      const depolyment = new apigateway.ApiGatewayDeployment(this, `${name}-deployment`, {
        restApiId: this.api.id,
      });
      new apigateway.ApiGatewayStage(this, `${name}-stage`, {
        restApiId: this.api.id,
        stageName: stageName,
        deploymentId: depolyment.id,
      });

      new apigateway.ApiGatewayBasePathMapping(this, `${name}-base-path-mapping`, {
        apiId: this.api.id,
        stageName: stageName,
        domainName: apiDomainName.domainName,
        dependsOn: [depolyment],
      });
      return depolyment;
    };
  }
}
