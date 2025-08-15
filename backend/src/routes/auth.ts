import { FastifyInstance } from "fastify";
import { Db } from "mongodb";
import { createToken, hashPassword, comparePassword } from "../utils/auth";

export default async function authRoutes(fastify: FastifyInstance, db: Db) {
  fastify.post("/api/register", async (req, reply) => {
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
      password: hashed,
      username,
      role: role || "teacher",
      createdAt
    });

    return { token: createToken(result.insertedId.toString()) };
  });

  fastify.post("/api/login", async (req, reply) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password required" });
    }

    const user = await db.collection("users").findOne({ email });
    if (!user) return reply.code(400).send({ error: "Invalid credentials" });

    const valid = await comparePassword(password, user.password);
    if (!valid) return reply.code(400).send({ error: "Invalid credentials" });

    return {
      token: createToken(user._id.toString()),
      user: {
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  });
}
