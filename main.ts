import { Construct } from 'constructs';
import { App, TerraformOutput, TerraformStack } from 'cdktf';
import { apigateway, AwsProvider } from '@cdktf/provider-aws';
import { NullProvider, Resource } from '@cdktf/provider-null';
import {
  AwsOnDemndDynamodb,
  AwsS3Bucket,
  AwsLambdaFunction,
  AwsApiGateway,
  AwsCloudfront,
  AwsRoute53,
  AwsAcmCertificate,
  AwsSes,
  AwsWafv2,
} from './constructs';

interface IApiResourceList {
  [key: string]: apigateway.ApiGatewayResource;
}

interface IApiResource {
  [key: string]: {
    path: string;
    child?: {
      [key: string]: {
        path: string;
      };
    };
  };
}

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    new NullProvider(this, 'null');

    new AwsOnDemndDynamodb(this, 'vt6005cem.space-booking', {
      name: 'vt6005cem.space-booking',
      hashKey: 'email',
      attributes: [{ name: 'email', type: 'S' }],
    });

    new AwsOnDemndDynamodb(this, 'vt6005cem.space-time-slot', {
      name: 'vt6005cem.space-time-slot',
      hashKey: 'booking_slot',
      rangeKey: 'location',
      attributes: [
        { name: 'booking_slot', type: 'S' },
        { name: 'location', type: 'S' },
      ],
    });

    const aws_s3 = new AwsS3Bucket(this, 'aws-s3-bucket', {
      bucket: 'vt6005cem-security-bucket',
      acl: 'private',
      policy: '',
      serverSideEncryptionConfiguration: {
        rule: {
          bucketKeyEnabled: true,
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      website: {
        indexDocument: 'index.html',
      },
      forceDestroy: true,
    });

    const aws_route53 = new AwsRoute53(this, 'aws-route53', {
      name: 'vt6005cem.space',
      records: [],
      forceDestroy: true,
    });

    const aws_acm = new AwsAcmCertificate(this, 'aws-acm-certificate', {
      domainName: '*.vt6005cem.space',
      validationMethod: 'DNS',
      route53: aws_route53,
    });

    const aws_wafv2 = new AwsWafv2(this, 'aws-wafv2', {
      name: 'vt6005cem_space',
    });

    new Resource(this, 'wafv2-null-resource', {
      dependsOn: [aws_wafv2.webAcl],
    });

    new AwsCloudfront(this, 'aws-cloudfront', {
      aliases: ['*.vt6005cem.space'],
      enabled: true,
      defaultRootObject: 'index.html',
      defaultCacheBehavior: {
        allowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        targetOriginId: aws_s3.bucket.id,
        viewerProtocolPolicy: 'redirect-to-https',
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
      },
      origin: [{ domainName: aws_s3.bucket.bucketDomainName, originId: aws_s3.bucket.id }],
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      viewerCertificate: {
        acmCertificateArn: aws_acm.certificate.arn,
        sslSupportMethod: 'sni-only',
        minimumProtocolVersion: 'TLSv1.2_2021',
      },
      priceClass: 'PriceClass_100',
      route53: aws_route53,
      bucket: aws_s3.bucket,
      wafv2: aws_wafv2,
    });

    new AwsSes(this, 'aws-ses', {
      domain: 'vt6005cem.space',
      route53: aws_route53,
    });

    const aws_api = new AwsApiGateway(this, 'aws-apigateway', {
      name: 'vt6005cem.space',
      description: 'vt6005cem.space rest api',
      domanName: 'vt6005cem.space',
      aws_acm: aws_acm,
      aws_route53: aws_route53,
    });

    const apiResourceList: IApiResourceList = {};
    const apiResource: IApiResource = {
      'hello-world': {
        path: 'hello-world',
        child: {
          'hello-world-child': {
            path: 'hello-world-child',
          },
        },
      },
      createBookingRecord: {
        path: 'createBookingRecord',
      },
      confirmEmail: {
        path: 'confirmEmail',
        child: {
          confirmEmailChild: {
            path: '{id}',
          },
        },
      },
    };

    const createApiResource = (api: AwsApiGateway, resource: IApiResource, parentId: string) => {
      for (const [key, value] of Object.entries(resource)) {
        const apiResource = api.apiGatewayResource(key, parentId, value.path);
        apiResourceList[key] = apiResource;
        if (value.child) {
          new Resource(this, `${key}-null-resource`, {
            dependsOn: [apiResource],
          });
          createApiResource(api, value.child, apiResource.id);
        }
      }
    };
    createApiResource(aws_api, apiResource, aws_api.api.rootResourceId);

    const aws_role = 'arn:aws:iam::097759201858:role/LambdaAdmin';

    const lb = {
      'hello-world': {
        function: new AwsLambdaFunction(this, 'hello-world', {
          functionName: 'hello-world',
          description: 'Hello World',
          s3Bucket: aws_s3.bucket.bucket,
          s3Key: 'lambda.zip',
          handler: 'hello-world.handler',
          role: aws_role,
          environment: {
            variables: {
              AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            },
          },
          integration: {
            type: 'ApiGateway',
            apiGateway: aws_api.api,
          },
        }),
        integration: {
          apigateway: [
            {
              api: aws_api.api,
              resource: apiResourceList['hello-world'],
              httpMethod: 'GET',
              type: 'AWS_PROXY',
            },
          ],
        },
      },
      createBookingRecord: {
        function: new AwsLambdaFunction(this, 'createBookingRecord', {
          functionName: 'createBookingRecord',
          description: 'Hello World',
          s3Bucket: aws_s3.bucket.bucket,
          s3Key: 'lambda.zip',
          handler: 'createBookingRecord.handler',
          role: aws_role,
          environment: {
            variables: {
              AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            },
          },
          integration: {
            type: 'ApiGateway',
            apiGateway: aws_api.api,
          },
        }),
        integration: {
          apigateway: [
            {
              api: aws_api.api,
              resource: apiResourceList['createBookingRecord'],
              httpMethod: 'POST',
              type: 'AWS_PROXY',
            },
          ],
        },
      },
      optionMethod: {
        function: new AwsLambdaFunction(this, 'optionMethod', {
          functionName: 'optionMethod',
          description: 'Hello World',
          s3Bucket: aws_s3.bucket.bucket,
          s3Key: 'lambda.zip',
          handler: 'optionMethod.handler',
          role: aws_role,
          environment: {
            variables: {
              AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            },
          },
          integration: {
            type: 'ApiGateway',
            apiGateway: aws_api.api,
          },
        }),
        integration: {
          apigateway: [
            {
              api: aws_api.api,
              resource: apiResourceList['createBookingRecord'],
              httpMethod: 'OPTIONS',
              type: 'AWS_PROXY',
            },
          ],
        },
      },
      confirmEmail: {
        function: new AwsLambdaFunction(this, 'confirmEmail', {
          functionName: 'confirmEmail',
          description: 'Hello World',
          s3Bucket: aws_s3.bucket.bucket,
          s3Key: 'lambda.zip',
          handler: 'confirmEmail.handler',
          role: aws_role,
          environment: {
            variables: {
              AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            },
          },
          integration: {
            type: 'ApiGateway',
            apiGateway: aws_api.api,
          },
        }),
        integration: {
          apigateway: [
            {
              api: aws_api.api,
              resource: apiResourceList['confirmEmailChild'],
              httpMethod: 'GET',
              type: 'AWS_PROXY',
            },
          ],
        },
      },
    };
    for (const [key, value] of Object.entries(lb)) {
      for (const [key2, value2] of Object.entries(value.integration.apigateway)) {
        aws_api.apiGatewayMethod(`${key}-${key2}`, value2.resource, value2.httpMethod);
        aws_api.apiGatewayIntegration(
          `${key}-${key2}`,
          value2.resource,
          value2.httpMethod,
          value.function.lambda.invokeArn,
          value2.type,
        );
      }
    }
    const apiDeployment = aws_api.apiGatewayDeployment('vt6005cem.space', 'dev');
    new TerraformOutput(this, 'api-gateway-url', {
      value: apiDeployment.invokeUrl,
    });
  }
}

const app = new App();
new MyStack(app, 'security');
app.synth();
