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

export const getDateFromDynamoDB = async (tableName: string, key: any, AttributesToGet: any) => {
  const currDateStatus = await ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: key,
      AttributesToGet: AttributesToGet,
    }),
  );
  return currDateStatus;
};

export const addDataToDynamoDB = async (tableName: string, item: any) => {
  const res = await ddbDocClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    }),
  );
  return res;
};

export const isExistRecord = async (tableName: string, key: any) => {
  const res = await ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: key,
    }),
  );
  return res.Item != undefined ? true : false;
};
