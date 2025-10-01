import mongoose from "mongoose";
import { FastifyReply, FastifyRequest } from "fastify";
import Activity from "../models/Activity";

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
    try {
      try {
        const auth = (req.headers as any).authorization as string | undefined;
        const { verifyToken } = require("../utils/auth");
        const payload = verifyToken(auth);
        const actor = payload?.id;
        await Activity.create({ action: `Created grade "${grade.name}"`, actor, icon: "🎓" });
      } catch (inner) {
        await Activity.create({ action: `Created grade "${grade.name}"`, icon: "🎓" });
      }
    } catch (e) {
      console.warn('Failed to record activity for grade creation', e);
    }
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
    try {
      const Activity = require("../models/Activity").default;
      const auth = (req.headers as any).authorization as string | undefined;
      const { verifyToken } = require("../utils/auth");
      const payload = verifyToken(auth);
      const actor = payload?.id;
      await Activity.create({ action: `Deleted grade "${grade.name}"`, actor, icon: "🗑️" });
    } catch (e) {
      console.warn('Failed to record activity for grade deletion', e);
    }
    reply.send({ message: "Grade deleted" });
  } catch (err) {
    reply.status(400).send({ message: "Failed to delete grade" });
  }
}
