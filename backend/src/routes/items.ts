import { FastifyInstance } from "fastify";
import Item from "../models/Item";
import Content from "../models/Content";
import path from "path";
import { extractPdfText } from "../utils/pdfParse";
import { generateQuestionsWithGroq } from "../utils/groq";

export default async function itemsRoutes(fastify: FastifyInstance) {
  fastify.get("/api/items", async (req, reply) => {
    const items = await Item.find().sort({ createdAt: -1 });
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
    // Example: req.body = { contentId, bankId }
    const { contentId, bankId } = req.body as { contentId: string; bankId: string };
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
    } catch (err) {
      return reply.status(500).send({ message: "Failed to extract PDF text" });
    }
    // 4. Send pdfText to GROQ API to generate questions
    let generatedItems: any[] = [];
    try {
      generatedItems = await generateQuestionsWithGroq(pdfText);
    } catch (err) {
      return reply.status(500).send({ message: "GROQ API error" });
    }
    // 5. Insert generated items into DB, attaching bankId and contentId
    const itemsToInsert = generatedItems.map(q => ({
      bankId,
      contentId,
      type: q.type,
      question: q.question,
      options: q.options || [],
      answer: q.answer,
      metadata: { difficulty: q.difficulty || "", tags: q.tags || [] }
    }));
    console.log("[DEBUG] Items to insert:", itemsToInsert.slice(0, 3));
    if (itemsToInsert.length === 0) {
      console.error("[DEBUG] No items to insert. GROQ output:", generatedItems);
      return reply.status(500).send({ message: "No items generated from GROQ." });
    }
    try {
      const items = await Item.insertMany(itemsToInsert);
      console.log("[DEBUG] Items inserted:", items.slice(0, 3));
      reply.send(items);
    } catch (err) {
      console.error("[DEBUG] Error inserting items:", err);
      return reply.status(500).send({ message: "Failed to insert items", error: err });
    }
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
