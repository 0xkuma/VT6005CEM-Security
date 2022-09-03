export const api = (statusCode: number, body: any, headers: any) => {
  return {
    isBase64Encoded: false,
    statusCode: statusCode,
    body: JSON.stringify(body),
    headers: headers,
  };
};
