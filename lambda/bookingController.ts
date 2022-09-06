import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import { api } from './lib/api';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  // GetCommand,
  // UpdateCommand,
  // DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');
const ddbClient = new DynamoDBClient({
  region: 'us-east-1',
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const TABLE_NAME = process.env.TABLE_NAME || 'my-ondemand-dynamodb';

const originalHandler = async (event: any) => {
  const reqMethod = event.httpMethod;
  // const reqPath = event.path;
  switch (reqMethod) {
    case 'GET':
      return api(200, { message: 'Hello World' }, {});
    case 'POST':
      const res = await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            uuid: '03a77c90-dea7-5e18-a9fc-5c7de8689d21',
            h_hkid: 'bbb2ece6-ed57-559b-a298-6ce259112a5b',
          },
        }),
      );
      console.log(res);
      if (res.$metadata.httpStatusCode === 200) {
        return api(200, { message: 'Add Record Success' }, {});
      }
      return api(500, { message: 'Add Record Failed' }, {});
    case 'PUT':
      return api(200, { message: 'Hello World' }, {});
    case 'DELETE':
      return api(200, { message: 'Hello World' }, {});
    default:
      return api(400, { message: 'Bad Request' }, {});
  }
};

export const handler = middy(originalHandler)
  .use(httpEventNormalizer())
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());

originalHandler({
  resource: '/hello-world',
  path: '/hello-world',
  httpMethod: 'POST',
  headers: null,
  multiValueHeaders: null,
  queryStringParameters: {},
  multiValueQueryStringParameters: {},
  pathParameters: {},
  stageVariables: null,
  requestContext: {
    resourceId: '3so1u3',
    resourcePath: '/hello-world',
    httpMethod: 'POST',
    extendedRequestId: 'YCqGaFHPoAMF2tA=',
    requestTime: '06/Sep/2022:14:19:33 +0000',
    path: '/hello-world',
    accountId: '097759201858',
    protocol: 'HTTP/1.1',
    stage: 'test-invoke-stage',
    domainPrefix: 'testPrefix',
    requestTimeEpoch: 1662473973642,
    requestId: '2038e22d-b649-46e6-bd87-c2904f500c4d',
    identity: {
      cognitoIdentityPoolId: null,
      cognitoIdentityId: null,
      apiKey: 'test-invoke-api-key',
      principalOrgId: null,
      cognitoAuthenticationType: null,
      userArn: 'arn:aws:iam::097759201858:user/Admin',
      apiKeyId: 'test-invoke-api-key-id',
      userAgent:
        'aws-internal/3 aws-sdk-java/1.12.239 Linux/5.4.204-124.362.amzn2int.x86_64 OpenJDK_64-Bit_Server_VM/25.332-b08 java/1.8.0_332 vendor/Oracle_Corporation cfg/retry-mode/standard',
      accountId: '097759201858',
      caller: 'AIDARNQXHBJBFC4ERUWPI',
      sourceIp: 'test-invoke-source-ip',
      accessKey: 'ASIARNQXHBJBADSEQIXT',
      cognitoAuthenticationProvider: null,
      user: 'AIDARNQXHBJBFC4ERUWPI',
    },
    domainName: 'testPrefix.testDomainName',
    apiId: 'bqart4i8j0',
  },
  body: null,
  isBase64Encoded: false,
}).then(console.log);
