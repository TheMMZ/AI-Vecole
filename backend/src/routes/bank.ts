import { FastifyInstance } from "fastify";
import Bank from "../models/Bank";

export default async function bankRoutes(fastify: FastifyInstance) {
  // List all banks
  fastify.get("/api/banks", async (req, reply) => {
    try {
      const banks = await Bank.find();
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
  fastify.post("/api/banks", async (req, reply) => {
    try {
      const mongoose = require("mongoose");
      const { title, description, createdBy, gradeIds, standardIds } = req.body as {
        title: string;
        description?: string;
        createdBy?: string;
        gradeIds?: string[];
        standardIds?: string[];
      };
      const bank = new Bank({
        title,
        description,
        createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
        gradeIds: gradeIds?.map(id => new mongoose.Types.ObjectId(id)),
        standardIds: standardIds?.map(id => new mongoose.Types.ObjectId(id)),
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
