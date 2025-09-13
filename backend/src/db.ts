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

const client = new MongoClient(uri, { connectTimeoutMS: 10000 });

const MAX_RETRIES = parseInt(process.env.MONGODB_CONNECT_RETRIES || '5', 10);
const INITIAL_BACKOFF_MS = parseInt(process.env.MONGODB_INITIAL_BACKOFF_MS || '1000', 10);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function connectToDB(): Promise<Db> {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      await client.connect();
      console.log('Connected to MongoDB');
      return client.db();
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, err);
      if (attempt >= MAX_RETRIES) {
        console.error(`Exceeded max MongoDB connect attempts (${MAX_RETRIES}).`);
        throw err;
      }
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.log(`Retrying MongoDB connection in ${backoff}ms...`);
      await sleep(backoff);
    }
  }
}

export async function pingMongo(): Promise<boolean> {
  try {
    // run a cheap command to check connectivity
    await client.db().command({ ping: 1 });
    return true;
  } catch (err) {
    return false;
  }
}
