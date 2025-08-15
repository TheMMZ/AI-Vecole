import express, { Request, Response } from "express";
import Grade from "../models/Grade";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const grades = await Grade.find();
    res.json(grades);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ error: "Grade not found" });
    res.json(grade);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    res.status(201).json(grade);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!grade) return res.status(404).json({ error: "Grade not found" });
    res.json(grade);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);
    if (!grade) return res.status(404).json({ error: "Grade not found" });
    res.json({ message: "Grade deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
