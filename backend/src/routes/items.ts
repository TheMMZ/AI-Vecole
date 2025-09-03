import { FastifyInstance } from "fastify";
import Item from "../models/Item";
import Content from "../models/Content";
import path from "path";
import { extractPdfText } from "../utils/pdfParse";
import { generateQuestionsWithGemini } from "../utils/gemini";
import GeneratedOutput from "../models/GeneratedOutput";

export default async function itemsRoutes(fastify: FastifyInstance) {

  // Batch delete by contentId or bankId
  fastify.delete("/api/items", async (req, reply) => {
    const { contentId, bankId } = req.query as { contentId?: string; bankId?: string };
    if (!contentId && !bankId) {
      return reply.status(400).send({ message: "contentId or bankId query param required" });
    }
    let filter: any = {};
    if (contentId) filter.contentId = contentId;
    if (bankId) filter.bankId = bankId;
    try {
      const result = await Item.deleteMany(filter);
      reply.send({ success: true, deletedCount: result.deletedCount });
    } catch (err) {
      reply.status(500).send({ message: "Failed to delete items" });
    }
  });
  fastify.get("/api/items", async (req, reply) => {
    const { role, userId } = req.query as { role?: string; userId?: string };
    let filter = {};
    if (role === "teacher" && userId) {
      try {
        const mongoose = require("mongoose");
        filter = { createdBy: new mongoose.Types.ObjectId(userId) };
      } catch {
        filter = { createdBy: userId };
      }
    }
    const items = await Item.find(filter).sort({ createdAt: -1 });
    reply.send(items);
  });

  fastify.post("/api/items", async (req, reply) => {
    try {
      const item = new Item(req.body);
      await item.save();
      reply.send(item);
    } catch (err) {
      reply.status(400).send({ message: "Failed to create item" });
    }
  });

  // AI-powered item generation endpoint
  fastify.post("/api/items/generate", async (req, reply) => {
    // Example: req.body = { contentId, bankId, userId }
    const { contentId, bankId, userId } = req.body as { contentId: string; bankId: string; userId: string };
    if (!userId) {
      return reply.status(400).send({ message: "userId is required to generate items" });
    }
    // 1. Find the content document
    const contentDoc = await Content.findById(contentId);
    if (!contentDoc) {
      return reply.status(404).send({ message: "Content not found" });
    }
  // 2. Get the absolute path to the PDF file (fix path)
  const pdfPath = path.join(process.cwd(), "uploads", path.basename(contentDoc.fileUrl));
    // 3. Extract text from the PDF
    let pdfText = "";
    try {
      pdfText = await extractPdfText(pdfPath);
      console.log("[PDF EXTRACTION] First 500 chars:", pdfText.slice(0, 500));
      if (!pdfText.trim()) {
        console.warn("[PDF EXTRACTION] No text extracted from PDF:", pdfPath);
      }
    } catch (err) {
      console.error("[PDF EXTRACTION] Error extracting text:", err);
      return reply.status(500).send({ message: "Failed to extract PDF text" });
    }
    // 4. Send pdfText to GROQ API to generate questions
    let generated: any = { raw: "", questions: [] };
    try {
  generated = await generateQuestionsWithGemini(pdfText);
    } catch (err) {
  return reply.status(500).send({ message: "Gemini API error" });
    }

    // Save raw model output for auditing/debugging. If raw is empty, store an explanatory fallback
    let generatedOutputDoc: any = null;
    try {
      const rawToSave = generated.raw && generated.raw.trim() ? generated.raw : "[NO_RAW_RETURNED] GROQ returned no content or an error occurred.";
      generatedOutputDoc = await GeneratedOutput.create({ bankId, contentId, raw: rawToSave });
    } catch (err) {
      console.error("Failed to save generated raw output", err);
    }
    const generatedItems: any[] = generated.questions || [];
    // 5. If no questions were produced, return an error with the GeneratedOutput id for debugging
    if (!generatedItems.length) {
      return reply.status(500).send({ message: "No questions generated", generatedOutputId: generatedOutputDoc?._id });
    }
    // Insert generated items into DB, attaching bankId and contentId
    const itemsToInsert = generatedItems.map(q => ({
      bankId,
      contentId,
      generatedOutputId: generatedOutputDoc?._id,
      createdBy: userId,
      type: q.type,
      question: q.question,
      options: q.options || [],
      answer: q.answer,
      metadata: { difficulty: q.difficulty || "", tags: q.tags || [] }
    }));
    const items = await Item.insertMany(itemsToInsert);
    reply.send({ items, generatedOutputId: generatedOutputDoc?._id });
  });

  fastify.put("/api/items/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const update = req.body as Partial<{ name: string; description: string }>;
      const item = await Item.findByIdAndUpdate(id, update, { new: true });
      if (!item) return reply.status(404).send({ message: "Item not found" });
      reply.send(item);
    } catch (err) {
      reply.status(400).send({ message: "Failed to update item" });
    }
  });

  fastify.delete("/api/items/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const item = await Item.findByIdAndDelete(id);
      if (!item) return reply.status(404).send({ message: "Item not found" });
      reply.send({ success: true });
    } catch (err) {
      reply.status(400).send({ message: "Failed to delete item" });
    }
  });
}
