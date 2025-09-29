import User from "../models/User";
import { Request, Response } from "express";
import { hashPassword } from "../utils/auth";

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const updates: any = { ...req.body };
    // If password provided, hash it into passwordHash
    if (updates.password) {
      updates.passwordHash = await hashPassword(updates.password);
      delete updates.password;
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { email, name, password, role } = req.body as any;
    if (!email || !name || !password) return res.status(400).json({ error: 'Email, name and password are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });
    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, name, passwordHash, role: role || 'user' });
    res.status(201).json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
