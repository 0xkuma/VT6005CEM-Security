import { createHash, createCipheriv } from 'crypto';
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
  GetCommand,
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
const BOOKING_TABLE = process.env.BOOKING_TABLE || 'vt6005cem.space-booking';
const TIME_SLOT_TABLE = process.env.TIME_SLOT_TABLE || 'vt6005cem.space-time-slot';

const hashValue = (value: string) => {
  return createHash('sha256').update(value).digest('hex');
};

const encryptValue = (encrypt_iv: string, value: any) => {
  const key = process.env.ENCRYPT_KEY || '8ecb54b1d59359818750382052a7bb7a';
  const iv = encrypt_iv.slice(0, 16);
  const algorithm = 'aes-256-cbc';
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const isEqualValue = (value: any) => {
  return value === hashValue(value);
};

const getCurrDateStatus = async (slot_date: string) => {
  const currDateStatus = await ddbDocClient.send(
    new GetCommand({
      TableName: TIME_SLOT_TABLE,
      Key: {
        slot_date,
      },
    }),
  );
  return currDateStatus;
};

const addDataToDynamoDB = async (tableName: string, item: any) => {
  const res = await ddbDocClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    }),
  );
  return res;
};

const isExistRecord = async (h_hkid: string) => {
  const res = await ddbDocClient.send(
    new GetCommand({
      TableName: BOOKING_TABLE,
      Key: {
        h_hkid,
      },
    }),
  );
  return res.Item != undefined ? true : false;
};

const originalHandler = async (event: any) => {
  const reqMethod = event.httpMethod;
  const reqPath = event.path;
  switch (reqMethod) {
    case 'GET':
      Object.entries(event.body).forEach(([key, value]) => {
        console.log(key, value);
      });
      return api(200, { message: 'Hello World' }, {});
    case 'POST':
      switch (reqPath) {
        case '/booking':
          const { hkid, e_name, slot_date } = event.body;
          const h_hkid = hashValue(hkid);
          if (await isExistRecord(h_hkid)) {
            return api(400, { message: 'HKID already exist' }, {});
          }
          const currDateStatus = await getCurrDateStatus(slot_date);
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
        default:
          return api(404, { message: 'Not Found' }, {});
      }
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
