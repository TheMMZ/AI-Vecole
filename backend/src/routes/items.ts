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
      try {
        const Activity = require("../models/Activity").default;
        try {
          const auth = (req.headers as any).authorization as string | undefined;
          const { verifyToken } = require("../utils/auth");
          const payload = verifyToken(auth);
          const actor = payload?.id;
          await Activity.create({ action: `Created item "${item._id}"`, actor, icon: "✏️" });
        } catch (inner) {
          await Activity.create({ action: `Created item "${item._id}"`, icon: "✏️" });
        }
      } catch (e) {}
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
  // 2. Get the PDF data: support local uploads (/uploads/) and remote storj references (/storj/)
  let pdfText = "";
  try {
    if (contentDoc.fileUrl && contentDoc.fileUrl.startsWith('/storj/')) {
      // Request a presigned download URL from our controller and fetch the PDF bytes
      const key = contentDoc.fileUrl.replace(/^\/storj\//, '');
      try {
        const presignResp: any = await (async () => {
          // Reuse the storj controller utility by calling internal function via fastify.inject is not available here,
          // so call our /api/content/download-url endpoint instead
          const localResp = await fastify.inject({
            method: 'POST',
            url: '/api/content/download-url',
            payload: { key }
          });
          if (localResp.statusCode !== 200) throw new Error('Failed to get presigned download URL');
          return JSON.parse(localResp.payload);
        })();
        const downloadUrl = presignResp.url;
        // Use global fetch (Node 18+) if available, otherwise fail with a clear message
        const fetchFn: any = (globalThis as any).fetch;
        if (!fetchFn) {
          throw new Error('No fetch implementation available on the server (Node 18+ required)');
        }
        const r = await fetchFn(downloadUrl);
        if (!r.ok) throw new Error('Failed to download PDF from storage');
        const buffer = await r.arrayBuffer();
        pdfText = await extractPdfText(Buffer.from(buffer));
      } catch (err) {
        console.error('[PDF EXTRACTION] Error fetching PDF from Storj:', err);
        return reply.status(500).send({ message: 'Failed to fetch PDF from storage' });
      }
    } else {
      const pdfPath = path.join(process.cwd(), 'uploads', path.basename(contentDoc.fileUrl || ''));
      pdfText = await extractPdfText(pdfPath);
    }
    console.log('[PDF EXTRACTION] First 500 chars:', pdfText.slice(0, 500));
    if (!pdfText.trim()) {
      console.warn('[PDF EXTRACTION] No text extracted from PDF');
    }
  } catch (err) {
    console.error('[PDF EXTRACTION] Error extracting text:', err);
    return reply.status(500).send({ message: 'Failed to extract PDF text' });
  }
    // 4. Send pdfText to Gemini API to generate questions
    let generated: any = { raw: "", questions: [] };
    try {
      // Load bank to find associated grade/standard names/descriptions
      let gradeName = '';
      let gradeDescription = '';
      let standardName = '';
      let standardDescription = '';
      if (bankId) {
        try {
          const Bank = require('../models/Bank').default;
          const Grade = require('../models/Grade').default;
          const Standard = require('../models/Standard').default;
          const bankDoc = await Bank.findById(bankId).lean();
          if (bankDoc) {
            // use first grade/standard if multiple referenced
            const firstGradeId = (bankDoc.gradeIds && bankDoc.gradeIds[0]) || null;
            const firstStandardId = (bankDoc.standardIds && bankDoc.standardIds[0]) || null;
            if (firstGradeId) {
              try {
                const g = await Grade.findById(firstGradeId).lean();
                if (g) {
                  gradeName = g.name || '';
                  gradeDescription = g.description || '';
                }
              } catch (e) {}
            }
            if (firstStandardId) {
              try {
                const s = await Standard.findById(firstStandardId).lean();
                if (s) {
                  // Standard model uses 'code' and 'description'
                  standardName = s.code || '';
                  standardDescription = s.description || '';
                }
              } catch (e) {}
            }
          }
        } catch (e) {
          // ignore failures to fetch bank/grade/standard; proceed without contextual hints
        }
      }

      generated = await generateQuestionsWithGemini(pdfText, gradeName, gradeDescription, standardName, standardDescription);
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
    // Validate generated items and ensure required fields are present and valid for the Item model
    const normalized: any[] = [];
    for (const q of generatedItems) {
      const type = (q.type || '').toString();
      const question = (q.question || '').toString().trim();
      const options = Array.isArray(q.options) ? q.options.map((o:any) => String(o)) : [];
      const answer = q.answer ? String(q.answer) : '';
      if (!question) {
        console.warn('Skipping generated item with empty question', q);
        continue;
      }
      // Enforce enum: default to MCQ if type not recognized
      const allowedTypes = ['MCQ', 'TrueFalse'];
      const finalType = allowedTypes.includes(type) ? type : 'MCQ';
      // If answer is missing, try to derive it from options (use first option) or skip
      let finalAnswer = answer;
      if (!finalAnswer) {
        if (options.length) finalAnswer = options[0];
        else {
          console.warn('Skipping generated item with missing answer and no options', q);
          continue;
        }
      }
      normalized.push({
        bankId,
        contentId,
        generatedOutputId: generatedOutputDoc?._id,
        createdBy: userId,
        type: finalType,
        question,
        options,
        answer: finalAnswer,
        metadata: { difficulty: q.difficulty || '', tags: q.tags || [] }
      });
    }
    if (!normalized.length) return reply.status(500).send({ message: 'No valid items to insert', generatedOutputId: generatedOutputDoc?._id });
    const items = await Item.insertMany(normalized);
    reply.send({ items, generatedOutputId: generatedOutputDoc?._id });
  });

  fastify.put("/api/items/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const update = req.body as Partial<{ name: string; description: string }>;
      const item = await Item.findByIdAndUpdate(id, update, { new: true });
      if (!item) return reply.status(404).send({ message: "Item not found" });
      try {
        const Activity = require("../models/Activity").default;
        try {
          const auth = (req.headers as any).authorization as string | undefined;
          const { verifyToken } = require("../utils/auth");
          const payload = verifyToken(auth);
          const actor = payload?.id;
          await Activity.create({ action: `Updated item "${item._id}"`, actor, icon: "🛠️" });
        } catch (inner) {
          await Activity.create({ action: `Updated item "${item._id}"`, icon: "🛠️" });
        }
      } catch (e) {}
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
      try {
        const Activity = require("../models/Activity").default;
        try {
          const auth = (req.headers as any).authorization as string | undefined;
          const { verifyToken } = require("../utils/auth");
          const payload = verifyToken(auth);
          const actor = payload?.id;
          await Activity.create({ action: `Deleted item "${item._id}"`, actor, icon: "🗑️" });
        } catch (inner) {
          await Activity.create({ action: `Deleted item "${item._id}"`, icon: "🗑️" });
        }
      } catch (e) {}
      reply.send({ success: true });
    } catch (err) {
      reply.status(400).send({ message: "Failed to delete item" });
    }
  });
}
