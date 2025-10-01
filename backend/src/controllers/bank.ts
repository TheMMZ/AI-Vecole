import Bank from "../models/Bank";
import { FastifyReply, FastifyRequest } from "fastify";

export async function getAllBanks(req: FastifyRequest, reply: FastifyReply) {
  try {
    // @ts-ignore
    const { role, userId } = req.query as { role?: string; userId?: string };
    let filter = {};
    if (role === "teacher" && userId) {
      const mongoose = require("mongoose");
      filter = { createdBy: new mongoose.Types.ObjectId(userId) };
    }
    const banks = await Bank.find(filter);
    reply.send(banks);
  } catch (err: any) {
    reply.code(500).send({ error: err.message });
  }
}

export async function getBankById(req: FastifyRequest, reply: FastifyReply) {
  try {
    // @ts-ignore
    const bank = await Bank.findById(req.params.id);
    if (!bank) return reply.code(404).send({ error: "Bank not found" });
    reply.send(bank);
  } catch (err: any) {
    reply.code(500).send({ error: err.message });
  }
}

export async function createBank(req: FastifyRequest, reply: FastifyReply) {
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
    try {
      const Activity = require("../models/Activity").default;
      try {
        const auth = (req.headers as any).authorization as string | undefined;
        const { verifyToken } = require("../utils/auth");
        const payload = verifyToken(auth);
        const actor = payload?.id;
        await Activity.create({ action: `Created bank "${bank.title}"`, actor, icon: "🏦" });
      } catch (inner) {
        await Activity.create({ action: `Created bank "${bank.title}"`, icon: "🏦" });
      }
    } catch (e) {
      console.warn("Failed to record activity for bank creation", e);
    }
    reply.code(201).send(bank);
  } catch (err: any) {
    reply.code(400).send({ error: err.message });
  }
}

export async function updateBank(req: FastifyRequest, reply: FastifyReply) {
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
}

export async function deleteBank(req: FastifyRequest, reply: FastifyReply) {
  try {
    // @ts-ignore
    const bank = await Bank.findByIdAndDelete(req.params.id);
    if (!bank) return reply.code(404).send({ error: "Bank not found" });
    try {
      const Activity = require("../models/Activity").default;
      // Try to read actor from Authorization header
      const auth = (req.headers as any).authorization as string | undefined;
      const { verifyToken } = require("../utils/auth");
      const payload = verifyToken(auth);
      const actor = payload?.id;
      await Activity.create({ action: `Deleted bank "${bank.title}"`, actor, icon: "🗑️" });
    } catch (e) {
      console.warn("Failed to record activity for bank deletion", e);
    }
    reply.send({ message: "Bank deleted" });
  } catch (err: any) {
    reply.code(500).send({ error: err.message });
  }
}
