import { MongoClient, Db } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

// Support multiple common env var names so deployment platforms can use their preferred name.
const uri = (process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL) as string | undefined;

if (!uri) {
  console.error(
    "Missing MongoDB connection string. Set MONGODB_URI (or MONGO_URL / DATABASE_URL) in your environment variables."
  );
  // Exit with a non-zero code so the platform's process manager marks the deploy as failed.
  process.exit(1);
}

// Basic validation: must start with mongodb:// or mongodb+srv://
if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
  console.error(`Invalid MongoDB connection string scheme: ${uri}. It must start with "mongodb://" or "mongodb+srv://".`);
  process.exit(1);
}

const client = new MongoClient(uri);

export async function connectToDB(): Promise<Db> {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}
