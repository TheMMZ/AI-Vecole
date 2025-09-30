import { FastifyInstance } from "fastify";
import { Db } from "mongodb";
import { createToken, hashPassword, comparePassword } from "../utils/auth";

// Accept a provider function that returns the current Db instance (or null if not connected)
export default async function authRoutes(fastify: FastifyInstance, getDb: () => Db | null) {
  fastify.post("/api/register", async (req, reply) => {
    const db = getDb();
    if (!db) return reply.code(503).send({ error: "Database not available" });

    const { email, password, username, role } = req.body as { email?: string; password?: string; username?: string; role?: string };

    if (!email || !password || !username) {
      return reply.code(400).send({ error: "Email, username and password required" });
    }

    const userExists = await db.collection("users").findOne({ email });
    if (userExists) return reply.code(400).send({ error: "User already exists" });


    const hashed = await hashPassword(password);
    const createdAt = new Date();
    const result = await db.collection("users").insertOne({
      email,
      passwordHash: hashed,
      username,
      role: role || "teacher",
      createdAt
    });

    return { token: createToken(result.insertedId.toString()) };
  });

  fastify.post("/api/login", async (req, reply) => {
    const db = getDb();
    if (!db) return reply.code(503).send({ error: "Database not available" });

    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password required" });
    }

    const user = await db.collection("users").findOne({ email });
    if (!user) return reply.code(400).send({ error: "Invalid credentials" });

    // Support older records that might have 'password' or the newer 'passwordHash'.
    const hashField = (user as any).passwordHash || (user as any).password;
    if (!hashField) return reply.code(400).send({ error: "Invalid credentials" });

    let valid = false;
    try {
      valid = await comparePassword(password, hashField);
    } catch (e) {
      // If bcrypt compare fails for any reason, treat as invalid credentials rather than throwing 500.
      return reply.code(400).send({ error: "Invalid credentials" });
    }
    if (!valid) return reply.code(400).send({ error: "Invalid credentials" });

    // Block suspended users with clear message
    const suspended = (user as any).suspended;
    const suspendedUntil = (user as any).suspendedUntil;
    if (suspended) {
      if (suspendedUntil) {
        const until = new Date(suspendedUntil);
        const formatted = `${until.getMonth() + 1}/${until.getDate()}/${until.getFullYear()}`;
        return reply.code(403).send({ error: `Your account is suspended until ${formatted}` });
      }
      return reply.code(403).send({ error: `Your account is suspended permanently` });
    }

    return {
      token: createToken(user._id.toString()),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  });
}
