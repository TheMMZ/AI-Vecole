import User from "../models/User";
import { deleteObject } from "./storj";
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
    // If suspendedUntil is provided as a string, convert to Date
    if (updates.suspendedUntil && typeof updates.suspendedUntil === 'string') {
      updates.suspendedUntil = new Date(updates.suspendedUntil);
    }
    // Only delete the old profilePic when the client explicitly provided a
    // `profilePic` field in the update payload (either new value or null).
    // This avoids deleting the stored picture when unrelated fields (password,
    // username) are updated without touching profilePic.
    const incomingHasProfilePic = Object.prototype.hasOwnProperty.call(req.body || {}, 'profilePic');
    const existing = await User.findById(req.params.id);
    if (existing && incomingHasProfilePic) {
      const oldPic = existing.profilePic as string | undefined | null;
      const newPic = updates.profilePic as string | undefined | null;
      if (oldPic && oldPic !== newPic) {
        try {
          // stored values are like '/storj/<key>' — extract key when present
          const key = oldPic.replace(/^\/storj\//, '').replace(/^\//, '');
          if (key) await deleteObject(key);
        } catch (e) {}
      }
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
    const { email, username, password, role, suspended, suspendedUntil } = req.body as any;
    if (!email || !username || !password) return res.status(400).json({ error: 'Email, username and password are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'User already exists' });
    const passwordHash = await hashPassword(password);
    const createPayload: any = { email, username, passwordHash, role: role || 'user' };
    if (typeof suspended === 'boolean') createPayload.suspended = suspended;
    if (suspendedUntil) createPayload.suspendedUntil = new Date(suspendedUntil);
    const user = await User.create(createPayload);
    res.status(201).json(user);
  } catch (err) {
    // Handle duplicate email key error gracefully
    const anyErr: any = err;
    if (anyErr && anyErr.code === 11000) {
      return res.status(400).json({ error: 'User already exists' });
    }
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
