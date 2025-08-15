import express, { Request, Response } from "express";
import Standard from "../models/Standard";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const standards = await Standard.find();
    res.json(standards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const standard = await Standard.findById(req.params.id);
    if (!standard) return res.status(404).json({ error: "Standard not found" });
    res.json(standard);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const standard = new Standard(req.body);
    await standard.save();
    res.status(201).json(standard);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const standard = await Standard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!standard) return res.status(404).json({ error: "Standard not found" });
    res.json(standard);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const standard = await Standard.findByIdAndDelete(req.params.id);
    if (!standard) return res.status(404).json({ error: "Standard not found" });
    res.json({ message: "Standard deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
