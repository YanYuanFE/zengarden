import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env['R2_ACCOUNT_ID'] || '';
const accessKeyId = process.env['R2_ACCESS_KEY_ID'] || '';
const secretAccessKey = process.env['R2_SECRET_ACCESS_KEY'] || '';
const bucketName = process.env['R2_BUCKET_NAME'] || 'zengarden';
const publicUrl = process.env['R2_PUBLIC_URL'] || '';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadImage(
  base64Data: string,
  fileName: string,
  mimeType: string
): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64');

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `${publicUrl}/${fileName}`;
}

export async function uploadJson(
  data: object,
  fileName: string
): Promise<string> {
  const jsonString = JSON.stringify(data);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: jsonString,
      ContentType: 'application/json',
    })
  );

  return `${publicUrl}/${fileName}`;
}
