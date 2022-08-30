import { Construct } from 'constructs';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws';
import { AwsOnDemndDynamodb, AwsS3Bucket, AwsCloudfront } from './constructs';

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

    // const aws_api = new AwsApiGateway(this, 'aws-apigateway', {
    //   name: 'my-rest-api',
    //   description: 'My REST API',
    // });

    // new apigateway.ApiGatewayDeployment(this, 'aws-apigateway-deployment', {
    //   restApiId: aws_api.api.id,
    // });

    const aws_s3 = new AwsS3Bucket(this, 'aws-s3-bucket', {
      bucket: 'vt6005cem-security-bucket',
      acl: 'public-read',
      policy: '{}',
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

    new AwsCloudfront(this, 'aws-cloudfront', {
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
        cloudfrontDefaultCertificate: true,
      },
      priceClass: 'PriceClass_100',
    });
  }
}

const app = new App();
new MyStack(app, 'security');
app.synth();
