import Item from "../models/Item";
import { Request, Response } from "express";

export async function getAllItems(req: Request, res: Response) {
  try {
    const { role, userId } = req.query as { role?: string; userId?: string };
    let filter = {};
    if (role === "teacher" && userId) {
      const mongoose = require("mongoose");
      filter = { createdBy: new mongoose.Types.ObjectId(userId) };
    }
    const items = await Item.find(filter);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getItemById(req: Request, res: Response) {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createItem(req: Request, res: Response) {
  try {
    const mongoose = require("mongoose");
    const { bankId, contentId, generatedOutputId, createdBy, type, question, options, answer, metadata } = req.body;
    const item = new Item({
      bankId,
      contentId,
      generatedOutputId,
      createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
      type,
      question,
      options,
      answer,
      metadata
    });
    await item.save();
    res.status(201).json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateItem(req: Request, res: Response) {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteItem(req: Request, res: Response) {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    try {
      const Activity = require("../models/Activity").default;
      const authHeader = (req.headers as any).authorization as string | undefined;
      const { verifyToken } = require("../utils/auth");
      const payload = verifyToken(authHeader);
      const actor = payload?.id;
      await Activity.create({ action: `Deleted item "${item.question || item._id}"`, actor, icon: "🗑️" });
    } catch (e) {
      console.warn('Failed to record activity for item deletion', e);
    }
    res.json({ message: "Item deleted" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
