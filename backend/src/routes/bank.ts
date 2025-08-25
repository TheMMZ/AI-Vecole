import { FastifyInstance } from "fastify";
import Bank from "../models/Bank";
import User from "../models/User";

export default async function bankRoutes(fastify: FastifyInstance) {
  // List all banks
  // List banks: teachers see their own, admins see all
  fastify.get("/api/banks", async (req, reply) => {
    try {
      const user = (req as any).user;
      let query = {};
      if (user?.role === "teacher") {
        query = { teacherId: user._id };
      }
      const banks = await Bank.find(query);
      reply.send(banks);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Get bank by ID
  fastify.get("/api/banks/:id", async (req, reply) => {
    try {
      // @ts-ignore
      const bank = await Bank.findById(req.params.id);
      if (!bank) return reply.code(404).send({ error: "Bank not found" });
      reply.send(bank);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });

  // Create bank
  // Create bank: admin can assign teacher by name, teacher can only assign to self
  fastify.post("/api/banks", async (req, reply) => {
    try {
      const mongoose = require("mongoose");
      const user = (req as any).user;
      let teacherId = user?._id;
      const body = req.body as any;
      if (user?.role === "admin" && body.teacherName) {
        const teacher = await User.findOne({ name: body.teacherName, role: "teacher" });
        if (!teacher) return reply.code(400).send({ error: "Teacher not found" });
        teacherId = teacher._id;
      }
      const { title, description, createdBy, gradeIds, standardIds } = body;
      const bank = new Bank({
        title,
        description,
        createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
        teacherId,
        gradeIds: gradeIds?.map((id: string) => new mongoose.Types.ObjectId(id)),
        standardIds: standardIds?.map((id: string) => new mongoose.Types.ObjectId(id)),
      });
      await bank.save();
      reply.code(201).send(bank);
    } catch (err: any) {
      reply.code(400).send({ error: err.message });
    }
  });

  // Update bank
  fastify.put("/api/banks/:id", async (req, reply) => {
    try {
      const { title, description, createdBy, gradeIds, standardIds } = req.body as {
        title: string;
        description?: string;
        createdBy?: string;
        gradeIds?: string[];
        standardIds?: string[];
      };
      const { id } = req.params as { id: string };
      const bank = await Bank.findByIdAndUpdate(
        id,
        { title, description, createdBy, gradeIds, standardIds },
        { new: true }
      );
      if (!bank) return reply.code(404).send({ error: "Bank not found" });
      reply.send(bank);
    } catch (err: any) {
      reply.code(400).send({ error: err.message });
    }
  });

  // Delete bank
  fastify.delete("/api/banks/:id", async (req, reply) => {
    try {
      // @ts-ignore
      const bank = await Bank.findByIdAndDelete(req.params.id);
      if (!bank) return reply.code(404).send({ error: "Bank not found" });
      reply.send({ message: "Bank deleted" });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  });
}
