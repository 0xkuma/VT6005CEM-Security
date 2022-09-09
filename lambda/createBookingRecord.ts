import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import { api } from './lib/api';
import { isExistRecord, addDataToDynamoDB, getDateFromDynamoDB } from './lib/ddbController';
import { hashValue, encryptValue } from './lib/crypto';
import { BOOKING_TABLE, TIME_SLOT_TABLE } from './config';
import { sendEmail } from './lib/sesController';

const originalHandler = async (event: any) => {
  const { email, e_name, c_name, type, booking_date, slot, location } = event.body;
  const en_email = encryptValue(hashValue(email), email);
  const en_e_name = encryptValue(hashValue(email), e_name);
  const en_c_name = encryptValue(hashValue(email), c_name);
  const res = await addDataToDynamoDB(BOOKING_TABLE, {
    email: en_email,
    e_name: en_e_name,
    c_name: en_c_name,
    type: type,
    booking_slot: `${booking_date}#${slot}`,
    location: location,
    confirmed: false,
  });
  if (res.$metadata.httpStatusCode === 200) {
    const res = await sendEmail(email, 'Booking Confirmation', 'Your booking has been confirmed');
    if (res.$metadata.httpStatusCode === 200) {
      return api(200, { message: 'Success' }, {});
    }
  }
  return api(500, { message: 'Add Record Failed' }, {});
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
    body: JSON.stringify({
      email: 'cheungkamhung1998@gmail.com',
      e_name: 'John',
      c_name: 'John',
      type: '1',
      booking_date: '2021-01-01',
      slot: '1',
      location: 'Wan Chai',
    }),
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
