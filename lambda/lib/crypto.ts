import { createHash, createCipheriv, createDecipheriv } from 'crypto';

export const hashValue = (value: string) => {
  return createHash('sha256').update(value).digest('hex');
};

export const encryptValue = (encrypt_iv: string, value: any) => {
  const key = process.env.ENCRYPT_KEY || '8ecb54b1d59359818750382052a7bb7a';
  const iv = encrypt_iv.slice(0, 16);
  const algorithm = 'aes-256-cbc';
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decryptValue = (encrypt_iv: string, value: any) => {
  const key = process.env.ENCRYPT_KEY || '8ecb54b1d59359818750382052a7bb7a';
  const iv = encrypt_iv.slice(0, 16);
  const algorithm = 'aes-256-cbc';
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(value, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const isEqualValue = (value: any) => {
  return value === hashValue(value);
};
