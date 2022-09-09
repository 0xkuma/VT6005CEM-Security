import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import { api } from './lib/api';
import { isExistRecord, addDataToDynamoDB, getDateFromDynamoDB } from './lib/ddbController';
import { hashValue, encryptValue, decryptValue } from './lib/crypto';
import { BOOKING_TABLE, TIME_SLOT_TABLE } from './config';

const originalHandler = async (event: any) => {
  const { email } = event.body;
  const en_email = encryptValue(hashValue(email), email);
  if (await isExistRecord(BOOKING_TABLE, { email: en_email })) {
    const res = await getDateFromDynamoDB(BOOKING_TABLE, { email: en_email }, [
      'booking_slot',
      'c_name',
      'e_name',
      'location',
      'type',
    ]);
    if (res.$metadata.httpStatusCode === 200) {
      const de_c_name = decryptValue(hashValue(email), res.Item.c_name);
      const de_e_name = decryptValue(hashValue(email), res.Item.e_name);
      return api(
        200,
        { message: 'Success', data: { ...res.Item, c_name: de_c_name, e_name: de_e_name } },
        {},
      );
    }
    return api(500, { message: 'Get Record Failed' }, {});
  }
  return api(400, { message: 'Record not found' }, {});
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
    httpMethod: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    multiValueHeaders: null,
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    pathParameters: {},
    stageVariables: null,
    body: JSON.stringify({ email: 'abc@gmail.com' }),
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
