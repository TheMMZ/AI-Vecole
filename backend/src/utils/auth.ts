import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export function createToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    // token may be 'Bearer ...' or just the token
    const raw = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
    const payload = jwt.verify(raw, JWT_SECRET) as any;
    return payload;
  } catch (e) {
    return null;
  }
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}