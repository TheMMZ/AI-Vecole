import Item from "../models/Item";
import { Request, Response } from "express";

export async function getAllItems(req: Request, res: Response) {
  try {
    const items = await Item.find();
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
    const item = new Item(req.body);
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
    res.json({ message: "Item deleted" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
