import { FastifyInstance } from "fastify";
import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
}, { timestamps: true });

const Grade = mongoose.models.Grade || mongoose.model("Grade", gradeSchema);

export default async function gradesRoutes(fastify: FastifyInstance) {
  fastify.get("/api/grades", async (req, reply) => {
    const grades = await Grade.find().sort({ createdAt: -1 });
    reply.send(grades);
  });

  fastify.post("/api/grades", async (req, reply) => {
    try {
      const grade = new Grade(req.body);
      await grade.save();
      reply.send(grade);
    } catch (err) {
      reply.status(400).send({ message: "Failed to create grade" });
    }
  });

  fastify.put("/api/grades/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const update = req.body as Partial<{ name: string; description: string }>;
      const grade = await Grade.findByIdAndUpdate(id, update, { new: true });
      if (!grade) return reply.status(404).send({ message: "Grade not found" });
      reply.send(grade);
    } catch (err) {
      reply.status(400).send({ message: "Failed to update grade" });
    }
  });

  fastify.delete("/api/grades/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const grade = await Grade.findByIdAndDelete(id);
      if (!grade) return reply.status(404).send({ message: "Grade not found" });
      reply.send({ success: true });
    } catch (err) {
      reply.status(400).send({ message: "Failed to delete grade" });
    }
  });
}
