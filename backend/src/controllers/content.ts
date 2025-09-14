import Content from "../models/Content";
import { Request, Response } from "express";

export async function getAllContent(req: Request, res: Response) {
  try {
    const { role, userId } = req.query as { role?: string; userId?: string };
    let filter = {};
    if (role === "teacher" && userId) {
      const mongoose = require("mongoose");
      filter = { uploadedBy: new mongoose.Types.ObjectId(userId) };
    }
    const content = await Content.find(filter);
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getContentById(req: Request, res: Response) {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: "Content not found" });
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createContent(req: Request, res: Response) {
  try {
    const content = new Content(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateContent(req: Request, res: Response) {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!content) return res.status(404).json({ error: "Content not found" });
    res.json(content);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteContent(req: Request, res: Response) {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ error: "Content not found" });
    try {
      const Activity = require("../models/Activity").default;
      const authHeader = (req.headers as any).authorization as string | undefined;
      const { verifyToken } = require("../utils/auth");
      const payload = verifyToken(authHeader);
      const actor = payload?.id;
      await Activity.create({ action: `Deleted content "${content.title || content.filename || content._id}"`, actor, icon: "🗑️" });
    } catch (e) {
      console.warn('Failed to record activity for content deletion', e);
    }
    res.json({ message: "Content deleted" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
