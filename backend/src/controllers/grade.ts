import mongoose from "mongoose";
import { FastifyReply, FastifyRequest } from "fastify";

const Grade = mongoose.models.Grade || mongoose.model("Grade", new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
}, { timestamps: true }));

export async function getAllGrades(req: FastifyRequest, reply: FastifyReply) {
  const grades = await Grade.find().sort({ createdAt: -1 });
  reply.send(grades);
}

export async function createGrade(req: FastifyRequest, reply: FastifyReply) {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    reply.send(grade);
  } catch (err) {
    reply.status(400).send({ message: "Failed to create grade" });
  }
}

export async function updateGrade(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const update = req.body as Partial<{ name: string; description: string }>;
    const grade = await Grade.findByIdAndUpdate(id, update, { new: true });
    if (!grade) return reply.status(404).send({ message: "Grade not found" });
    reply.send(grade);
  } catch (err) {
    reply.status(400).send({ message: "Failed to update grade" });
  }
}

export async function deleteGrade(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const grade = await Grade.findByIdAndDelete(id);
    if (!grade) return reply.status(404).send({ message: "Grade not found" });
    reply.send({ message: "Grade deleted" });
  } catch (err) {
    reply.status(400).send({ message: "Failed to delete grade" });
  }
}
