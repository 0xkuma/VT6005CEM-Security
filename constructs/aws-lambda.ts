import { Construct } from 'constructs';
import { lambdafunction, apigateway } from '@cdktf/provider-aws';
import { Fn } from 'cdktf';

interface IApigateway {
  api: apigateway.ApiGatewayRestApi;
  root: apigateway.ApiGatewayMethod;
  httpMethod: string;
}

interface IIntergration {
  readonly apigateway?: IApigateway;
}

export interface LambdaFunctionProps {
  readonly functionName: string;
  readonly architectures?: ['x86_64' | 'arm64'];
  readonly description?: string;
  readonly s3Bucket?: string;
  readonly s3Key?: string;
  readonly handler?: string;
  readonly memorySize?: number;
  readonly runtime?: string;
  readonly timeout?: number;
  readonly layers?: string[];
  readonly environment?: lambdafunction.LambdaFunctionEnvironment;
  readonly role: string;
  readonly integration?: IIntergration;
  readonly tags?: { [key: string]: string };
}

export class AwsLambdaFunction extends Construct {
  public readonly lambda: lambdafunction.LambdaFunction;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const {
      functionName,
      architectures,
      description,
      s3Bucket,
      s3Key,
      handler,
      memorySize,
      runtime,
      timeout,
      layers,
      environment,
      role,
      integration,
      tags,
    } = props;

    this.lambda = new lambdafunction.LambdaFunction(this, `${functionName}-function`, {
      functionName: functionName,
      architectures: architectures || ['x86_64'],
      description: description || '',
      s3Bucket: s3Bucket || '',
      s3Key: s3Key || '',
      handler: handler || 'index.handler',
      memorySize: memorySize || 128,
      runtime: runtime || 'nodejs14.x',
      timeout: timeout || 3,
      layers: layers || [],
      environment: environment || {},
      role: role,
      sourceCodeHash: Fn.base64sha256(`./dist/${s3Key}.zip`),
      tags: tags || {},
    });

    if (integration?.apigateway) {
      new apigateway.ApiGatewayIntegration(this, `${functionName}-integration`, {
        restApiId: integration.apigateway!.api.id,
        resourceId: integration.apigateway!.root.id,
        httpMethod: integration.apigateway!.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: this.lambda.invokeArn,
      });

      new lambdafunction.LambdaPermission(this, `${functionName}-apigateway-permission`, {
        action: 'lambda:InvokeFunction',
        functionName: this.lambda.functionName,
        principal: 'apigateway.amazonaws.com',
        sourceArn: `${integration.apigateway!.api.executionArn}/*/*`,
      });
    }
  }
}
