import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpErrorHandler from '@middy/http-error-handler';
import { api } from './lib/api';
import { isExistRecord, addDataToDynamoDB, getDateFromDynamoDB } from './lib/dynamodb';
import { hashValue, encryptValue } from './lib/crypto';
import { BOOKING_TABLE, TIME_SLOT_TABLE } from './config';

const originalHandler = async (event: any) => {
  const { hkid, e_name, slot_date } = event.body;
  const h_hkid = hashValue(hkid);
  if (await isExistRecord(BOOKING_TABLE, { h_hkid })) {
    return api(400, { message: 'HKID already exist' }, {});
  }
  const currDateStatus = await getDateFromDynamoDB(TIME_SLOT_TABLE, { slot_date }, [
    'isHasVacant',
    'total',
  ]);
  if (currDateStatus.Item == undefined || currDateStatus.Item.isHasVacant) {
    let vancantNum = currDateStatus.Item == undefined ? 0 : currDateStatus.Item.total;
    const bookingRes = await addDataToDynamoDB(BOOKING_TABLE, {
      h_hkid: h_hkid,
      e_name: encryptValue(h_hkid, e_name),
      slot_date: slot_date,
    });
    const timeSlotRes = await addDataToDynamoDB(TIME_SLOT_TABLE, {
      slot_date: slot_date,
      total: vancantNum + 1,
      isHasVacant: vancantNum + 1 < 10,
    });
    if (
      bookingRes.$metadata.httpStatusCode === 200 &&
      timeSlotRes.$metadata.httpStatusCode === 200
    ) {
      return api(200, { message: 'Add Record Success' }, {});
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
    body: JSON.stringify({ hkid: '123456', e_name: 'John', slot_date: '2021-01-01' }),
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
