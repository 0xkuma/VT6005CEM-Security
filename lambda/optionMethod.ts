import { api } from './lib/api';

export const handler = async (event: any) => {
  return api(200, {}, {});
};
