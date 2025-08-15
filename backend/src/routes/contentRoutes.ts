import express, { Request, Response } from "express";
import Content from "../models/Content";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const content = await Content.find();
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: "Content not found" });
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const content = new Content(req.body);
    await content.save();
    res.status(201).json(content);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!content) return res.status(404).json({ error: "Content not found" });
    res.json(content);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);
    if (!content) return res.status(404).json({ error: "Content not found" });
    res.json({ message: "Content deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
