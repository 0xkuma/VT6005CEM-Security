import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import middy from '@middy/core';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import { api } from './lib/api';

const originalHandler = async (
  event: APIGatewayEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  /* your business logic */
  console.log('Hello World');
  return api(200, { message: 'Hello World' }, {});
};

export const handler = middy(originalHandler)
  .use(httpEventNormalizer())
  .use(httpHeaderNormalizer())
  .use(httpErrorHandler());
