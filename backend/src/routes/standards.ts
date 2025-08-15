import { FastifyInstance } from "fastify";
import mongoose from "mongoose";

const standardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
}, { timestamps: true });

const Standard = mongoose.models.Standard || mongoose.model("Standard", standardSchema);

export default async function standardsRoutes(fastify: FastifyInstance) {
  fastify.get("/api/standards", async (req, reply) => {
    const standards = await Standard.find().sort({ createdAt: -1 });
    reply.send(standards);
  });

  fastify.post("/api/standards", async (req, reply) => {
    try {
      const standard = new Standard(req.body);
      await standard.save();
      reply.send(standard);
    } catch (err) {
      reply.status(400).send({ message: "Failed to create standard" });
    }
  });

  fastify.put("/api/standards/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const update = req.body as Partial<{ name: string; description: string }>;
      const standard = await Standard.findByIdAndUpdate(id, update, { new: true });
      if (!standard) return reply.status(404).send({ message: "Standard not found" });
      reply.send(standard);
    } catch (err) {
      reply.status(400).send({ message: "Failed to update standard" });
    }
  });

  fastify.delete("/api/standards/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const standard = await Standard.findByIdAndDelete(id);
      if (!standard) return reply.status(404).send({ message: "Standard not found" });
      reply.send({ success: true });
    } catch (err) {
      reply.status(400).send({ message: "Failed to delete standard" });
    }
  });
}
