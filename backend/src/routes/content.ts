import { FastifyInstance } from "fastify";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import fastifyMultipart from "@fastify/multipart";
import { FastifyRequest, FastifyReply } from "fastify";
import { Multipart } from "@fastify/multipart";
import Content from "../models/Content";

async function contentRoutes(fastify: FastifyInstance) {
  fastify.register(fastifyMultipart);

  fastify.get("/api/content", async (req, reply) => {
    const files = await Content.find().sort({ createdAt: -1 });
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
    const filename = data.filename;
    const filePath = path.join(__dirname, "../../uploads", filename);
    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      data.file.pipe(stream);
      stream.on("finish", () => resolve(undefined));
      stream.on("error", reject);
    });
    const fileUrl = `/uploads/${filename}`;
    // Get title from form field if provided
    const title = (data.fields && data.fields.title && data.fields.title.value) || filename;
    // TODO: get user from auth (for now, use a dummy user)
    const uploadedBy = new mongoose.Types.ObjectId();
    const content = new Content({ title, fileUrl, uploadedBy });
    await content.save();
    reply.send({
      _id: content._id,
      filename: content.title,
      url: content.fileUrl,
      uploadedAt: content.createdAt
    });
  });

  fastify.delete("/api/content/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const content = await Content.findByIdAndDelete(id);
    if (!content) return reply.status(404).send({ message: "File not found" });
    // Remove file from disk
    try {
      fs.unlinkSync(path.join(__dirname, "../../uploads", path.basename(content.fileUrl)));
    } catch {}
    reply.send({ success: true });
  });
}

export default contentRoutes;
