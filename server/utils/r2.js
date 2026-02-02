import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';

let cachedClient;

const getR2Config = () => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  const endpoint = process.env.R2_ENDPOINT || (accountId
    ? `https://${accountId}.r2.cloudflarestorage.com`
    : undefined);

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
    endpoint,
  };
};

const getClient = (config) => {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretAccessKey || '',
      },
    });
  }
  return cachedClient;
};

const sanitizeFileName = (name = '') =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export const uploadToR2 = async ({ buffer, originalname, contentType, prefix = 'uploads' }) => {
  const config = getR2Config();
  if (!config.bucket || !config.publicBaseUrl || !config.endpoint || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error('R2 configuration missing. Check R2_* env variables.');
  }

  const ext = path.extname(originalname || '') || '.jpg';
  const base = sanitizeFileName(path.basename(originalname || 'image', ext));
  const key = `${prefix}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${base}${ext}`;

  const s3 = getClient(config);
  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    })
  );

  const url = `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  return { url, key };
};
