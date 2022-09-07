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
      hashKey: 'h_hkid',
      attributes: [
        { name: 'h_hkid', type: 'S' },
      ],
    });

    new AwsOnDemndDynamodb(this, 'vt6005cem.space-time-slot', {
      name: 'vt6005cem.space-time-slot',
      hashKey: 'slot_date',
      attributes: [
        { name: 'slot_date', type: 'S' },
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

    const aws_api = new AwsApiGateway(this, 'aws-apigateway', {
      name: 'vt6005cem.space',
      description: 'vt6005cem.space rest api',
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

    const lb = {
      'hello-world': {
        function: new AwsLambdaFunction(this, 'hello-world', {
          functionName: 'hello-world',
          description: 'Hello World',
          s3Bucket: aws_s3.bucket.bucket,
          s3Key: 'lambda.zip',
          handler: 'hello-world.handler',
          role: 'arn:aws:iam::097759201858:role/LambdaAdmin',
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
          apigateway: {
            api: aws_api.api,
            resource: apiResourceList['hello-world'],
            httpMethod: 'GET',
          },
        },
      },
    };
    for (const [key, value] of Object.entries(lb)) {
      aws_api.apiGatewayMethod(
        key,
        value.integration.apigateway.resource,
        value.integration.apigateway.httpMethod,
      );
      aws_api.apiGatewayIntegration(
        key,
        value.integration.apigateway.resource,
        'GET',
        value.function.lambda.invokeArn,
      );
    }
    const apiDeployment = aws_api.apiGatewayDeployment('vt6005cem.space', 'dev');
    new TerraformOutput(this, 'api-gateway-url', {
      value: apiDeployment.invokeUrl,
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
    });

    new AwsSes(this, 'aws-ses', {
      domain: 'vt6005cem.space',
      route53: aws_route53,
    });
  }
}

const app = new App();
new MyStack(app, 'security');
app.synth();
