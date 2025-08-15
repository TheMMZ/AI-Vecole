import { MongoClient, Db } from "mongodb";
import * as dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI as string;
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
