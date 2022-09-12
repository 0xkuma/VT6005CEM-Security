export const api = (statusCode: number, body: any, headers: any) => {
  return {
    isBase64Encoded: false,
    statusCode: statusCode,
    body: JSON.stringify(body),
    headers: Object.assign(
      {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': 'https://www.vt6005cem.space',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      },
      headers,
    ),
  };
};
