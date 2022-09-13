import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import { api } from './lib/api';
import { isExistRecord, updateDataToDynamoDB } from './lib/ddbController';
import { BOOKING_TABLE } from './config';

const originalHandler = async (event: any) => {
  console.log(event);
  const { id } = event.pathParameters;
  if (await isExistRecord(BOOKING_TABLE, { email: id })) {
    const res = await updateDataToDynamoDB(BOOKING_TABLE, { email: id }, 'set confirmed = :c', {
      ':c': true,
    });
    if (res.$metadata.httpStatusCode === 200) {
      return api(200, { message: 'Success' }, {});
    }
    return api(500, { message: 'Update Record Failed' }, {});
  }
  return api(400, { message: 'Record Not Found' }, {});
};

export const handler = middy(originalHandler)
  .use(httpEventNormalizer())
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
