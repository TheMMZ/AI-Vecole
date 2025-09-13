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

// Global handlers to capture uncaught errors and rejections for better diagnostics in production
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception', err);
  // Give logs time to flush then exit
  setTimeout(() => process.exit(1), 100);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection', reason);
  setTimeout(() => process.exit(1), 100);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

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

  // Start the HTTP server first (so the process stays up) then connect DB in background
  let dbRef: any = null;

  // Protect API routes: if db not ready, return 503
  fastify.addHook('onRequest', async (req, reply) => {
    if (req.url.startsWith('/api') && !dbRef) {
      return reply.status(503).send({ error: 'Database not available yet' });
    }
  });

  // Connect to DB in background with retry/backoff; set dbRef when ready
  (async () => {
    try {
      const db = await connectToDB();
      dbRef = db;
    } catch (err) {
      console.error('Failed to connect to MongoDB after retries:', err);
    }
  })();

  // Connect Mongoose (in background too)
  (async () => {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vecole-db";
      await mongoose.connect(MONGODB_URI);
      console.log("Mongoose connected");
    } catch (err) {
      console.error('Mongoose connection failed:', err);
    }
  })();

    try {
    console.log('Registering auth routes');
    await authRoutes(fastify, () => dbRef);
    console.log('Registered auth routes');
  } catch (err) {
    console.error('Failed registering auth routes', err);
  }

  try {
    console.log('Registering bank routes');
    await bankRoutes(fastify);
    console.log('Registered bank routes');
  } catch (err) {
    console.error('Failed registering bank routes', err);
  }

  try {
    console.log('Registering grades routes');
    await gradesRoutes(fastify);
    console.log('Registered grades routes');
  } catch (err) {
    console.error('Failed registering grades routes', err);
  }

  try {
    console.log('Registering items routes');
    await itemsRoutes(fastify);
    console.log('Registered items routes');
  } catch (err) {
    console.error('Failed registering items routes', err);
  }

  try {
    console.log('Registering standards routes');
    await standardsRoutes(fastify);
    console.log('Registered standards routes');
  } catch (err) {
    console.error('Failed registering standards routes', err);
  }

  try {
    console.log('Registering content routes');
    await contentRoutes(fastify);
    console.log('Registered content routes');
  } catch (err) {
    console.error('Failed registering content routes', err);
  }

  // Root route and health check
  fastify.get("/", async () => ({
    status: "API is running",
    routes: {
      ping: "/api/ping",
      auth: "/api/auth"
    }
  }));

  fastify.get('/health', async () => ({ status: 'ok' }));
  // Debug endpoint for memory/uptime diagnostics
  fastify.get('/debug', async () => ({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    pid: process.pid
  }));

  // Periodic memory logging to detect leaks/OOM
  setInterval(() => {
    const m = process.memoryUsage();
    console.log(`MEM_STATS pid=${process.pid} rss=${m.rss} heapUsed=${m.heapUsed} heapTotal=${m.heapTotal}`);
  }, 15000);

  try {
  const port = parseInt(process.env.PORT || "4000", 10);
  const host = process.env.HOST || '0.0.0.0';
  await fastify.listen({ port, host });
  console.log(`Fastify API running and listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
