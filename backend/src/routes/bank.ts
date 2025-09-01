import { FastifyInstance } from "fastify";

import { getAllBanks, getBankById, createBank, updateBank, deleteBank } from "../controllers/bankController";

export default async function bankRoutes(fastify: FastifyInstance) {
  // List all banks
  fastify.get("/api/banks", getAllBanks);

  // Get bank by ID
  fastify.get("/api/banks/:id", getBankById);

  // Create bank
  fastify.post("/api/banks", createBank);

  // Update bank
  fastify.put("/api/banks/:id", updateBank);

  // Delete bank
  fastify.delete("/api/banks/:id", deleteBank);
}
