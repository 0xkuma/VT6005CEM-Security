import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
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
const TABLE_NAME = process.env.TABLE_NAME || 'vt6005cem.space';

const originalHandler = async (event: any) => {
  const reqMethod = event.httpMethod;
  const reqPath = event.path;
  switch (reqMethod) {
    case 'GET':
      return api(200, { message: 'Hello World' }, {});
    case 'POST':
      switch (reqPath) {
        case '/booking':
          console.log(event.body);
          const { hkid } = event.body;
          const res = await ddbDocClient.send(
            new PutCommand({
              TableName: TABLE_NAME,
              Item: {
                h_hkid: hkid,
              },
            }),
          );
          console.log(res);
          if (res.$metadata.httpStatusCode === 200) {
            return api(200, { message: 'Add Record Success' }, {});
          }
          break;
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
  .use(httpJsonBodyParser())
  .use(httpErrorHandler());

handler(
  {
    resource: '/hello-world',
    path: '/booking',
    httpMethod: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    multiValueHeaders: null,
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    pathParameters: {},
    stageVariables: null,
    body: JSON.stringify({ hkid: '123456' }),
    isBase64Encoded: false,
  },
  {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'vt6005cem.space',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:vt6005cem.space',
    memoryLimitInMB: '128',
    awsRequestId: '1234567890',
    logGroupName: '/aws/lambda/vt6005cem.space',
    logStreamName: '2021/01/01/[$LATEST]1234567890',
    getRemainingTimeInMillis: () => 1234567890,
    done: (error: Error, result: any) => void 0,
    fail: (error: Error) => void 0,
    succeed: (messageOrObject: any) => void 0,
  },
).then(console.log);
