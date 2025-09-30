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
  const folder = body?.folder as string | undefined; // optional folder like 'Profils' or 'Contents'
  const userId = body?.userId as string | undefined; // optional userId to name profile images
  const contentType = body?.contentType || 'application/pdf';
  if (!filename) return reply.status(400).send({ error: 'filename required' });

  // If caller requested a profile upload and provided a userId, use Profils/<userId>.<ext>
  let key: string;
  try {
    if (folder && folder === 'Profils' && userId) {
      // preserve extension from filename
      const ext = filename.includes('.') ? filename.split('.').pop() : '';
      const safeExt = ext ? `.${ext}` : '';
      key = `Profils/${userId}${safeExt}`;
    } else {
      // default to Contents/<timestamp>-<filename> for content uploads
      key = `Contents/${Date.now()}-${filename}`;
    }
  } catch (e) {
    // fallback
    key = `Contents/${Date.now()}-${filename}`;
  }

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
