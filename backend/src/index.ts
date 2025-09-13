import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { connectToDB } from "./db";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import bankRoutes from "./routes/bank";
import gradesRoutes from "./routes/grades";
import itemsRoutes from "./routes/items";
import standardsRoutes from "./routes/standards";
import contentRoutes from "./routes/content";

const fastify = Fastify();

async function start() {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
  fastify.register(fastifyCors, {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });
  // Serve static files from uploads directory
  fastify.register(fastifyStatic, {
    root: path.join(__dirname, "../uploads"),
    prefix: "/uploads/",
  });

  // Connect native MongoDB for auth
  const db = await connectToDB();

  // Connect Mongoose for Mongoose models
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vecole-db";
  await mongoose.connect(MONGODB_URI);
  console.log("Mongoose connected");

  await authRoutes(fastify, db);
  await bankRoutes(fastify);
  await gradesRoutes(fastify);
  await itemsRoutes(fastify);
  await standardsRoutes(fastify);
  await contentRoutes(fastify);

  // Root route
  fastify.get("/", async () => ({
    status: "API is running",
    routes: {
      ping: "/api/ping",
      auth: "/api/auth"
    }
  }));

  try {
    const port = parseInt(process.env.PORT || "4000", 10);
    await fastify.listen({ port });
    console.log(`Fastify API running at http://0.0.0.0:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
