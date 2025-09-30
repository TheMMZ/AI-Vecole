import { FastifyRequest, FastifyReply } from 'fastify';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.STORJ_REGION || 'us-east-1',
  endpoint: process.env.STORJ_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.STORJ_ACCESS_KEY || '',
    secretAccessKey: process.env.STORJ_SECRET_KEY || '',
  },
});

export async function getUploadUrl(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any;
  const filename = body?.filename;
  const contentType = body?.contentType || 'application/pdf';
  if (!filename) return reply.status(400).send({ error: 'filename required' });

  const key = `Contents/${Date.now()}-${filename}`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.STORJ_BUCKET,
    Key: key,
    ContentType: contentType,
    ACL: 'private'
  });

  try {
    const url = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 minutes
    return reply.send({ url, key });
  } catch (err) {
    req.log?.error?.(err);
    return reply.status(500).send({ error: 'Could not generate upload URL' });
  }
}

export async function getDownloadUrl(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as any;
  const key = body?.key;
  if (!key) return reply.status(400).send({ error: 'key required' });
  const cmd = new GetObjectCommand({ Bucket: process.env.STORJ_BUCKET, Key: key });
  try {
    const url = await getSignedUrl(s3, cmd, { expiresIn: 60 });
    return reply.send({ url });
  } catch (err) {
    req.log?.error?.(err);
    return reply.status(500).send({ error: 'Could not generate download URL' });
  }
}
