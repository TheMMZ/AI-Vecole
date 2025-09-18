import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import fastifyMultipart from "@fastify/multipart";
import { FastifyRequest, FastifyReply } from "fastify";
import { Multipart } from "@fastify/multipart";
import Content from "../models/Content";
import { getUploadUrl, getDownloadUrl } from "../controllers/storj";

async function contentRoutes(fastify: FastifyInstance) {
  fastify.register(fastifyMultipart);

  fastify.get("/api/content", async (req, reply) => {
    const { role, userId } = req.query as { role?: string; userId?: string };
    let filter = {};
    if (role === "teacher" && userId) {
      try {
        filter = { uploadedBy: new mongoose.Types.ObjectId(userId) };
      } catch {
        filter = { uploadedBy: userId };
      }
    }
    const files = await Content.find(filter).sort({ createdAt: -1 });
    reply.send(files.map(f => ({
      _id: f._id,
      filename: f.title,
      url: f.fileUrl,
      uploadedAt: f.createdAt
    })));
  });

  fastify.post("/api/content/upload", async (req, reply) => {
  const data = await (req as any).file();
    if (!data) return reply.status(400).send({ message: "No file uploaded" });
    // Ensure uploads directory exists (prevents ENOENT on containers without the folder)
    const uploadsDir = path.join(__dirname, "../../uploads");
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {
      // ignore; we'll catch write errors below
    }
    // sanitize filename to avoid path traversal
    const filename = path.basename(data.filename || `upload-${Date.now()}.pdf`);
    const filePath = path.join(uploadsDir, filename);
    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      data.file.pipe(stream);
      stream.on("finish", () => resolve(undefined));
      stream.on("error", reject);
    });
    const fileUrl = `/uploads/${filename}`;
    // Get title from form field if provided
    const title = (data.fields && data.fields.title && data.fields.title.value) || filename;
    // Use uploadedBy from form field if present, else fallback to dummy ObjectId
    let uploadedBy = undefined;
    if (data.fields && data.fields.uploadedBy && data.fields.uploadedBy.value) {
      try {
        uploadedBy = new mongoose.Types.ObjectId(data.fields.uploadedBy.value);
      } catch {
        uploadedBy = new mongoose.Types.ObjectId(); // fallback if invalid
      }
    } else {
      uploadedBy = new mongoose.Types.ObjectId();
    }
    const content = new Content({ title, fileUrl, uploadedBy });
    await content.save();
    reply.send({
      _id: content._id,
      filename: content.title,
      url: content.fileUrl,
      uploadedAt: content.createdAt
    });
  });

  // Presigned upload URL for Storj (S3-compatible)
  fastify.post('/api/content/upload-url', async (req, reply) => {
    return getUploadUrl(req, reply);
  });

  // After client uploads to Storj using the returned key, client calls confirm to persist metadata
  fastify.post('/api/content/confirm', async (req, reply) => {
    const body = req.body as any;
    const { key, filename, uploadedBy, size, mimeType } = body || {};
    if (!key || !filename) return reply.status(400).send({ error: 'key and filename required' });
    // Build a fileUrl that frontend can use to request a download URL later
    const fileUrl = `/storj/${key}`;
    let uploadedById = undefined;
    try {
      uploadedById = uploadedBy ? new (Content as any).mongoose.Types.ObjectId(uploadedBy) : new (Content as any).mongoose.Types.ObjectId();
    } catch {
      uploadedById = new (Content as any).mongoose.Types.ObjectId();
    }
    const content = new Content({ title: filename, fileUrl, uploadedBy: uploadedById });
    await content.save();
    return reply.send({ _id: content._id, filename: content.title, url: content.fileUrl, uploadedAt: content.createdAt, storageKey: key });
  });

  // Generate a temporary download URL for a given Storj key
  fastify.post('/api/content/download-url', async (req, reply) => {
    return getDownloadUrl(req, reply);
  });

  fastify.delete("/api/content/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const content = await Content.findByIdAndDelete(id);
    if (!content) return reply.status(404).send({ message: "File not found" });
    // Remove file from disk
    try {
      const maybeName = path.basename(content.fileUrl || '');
      const fileOnDisk = path.join(__dirname, "../../uploads", maybeName);
      if (fs.existsSync(fileOnDisk)) {
        fs.unlinkSync(fileOnDisk);
      }
    } catch {}
    reply.send({ success: true });
  });
}

export default contentRoutes;
