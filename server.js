import express from "express";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// MongoDB URI
const URI = process.env.MONGO_URI;
if (!URI) {
  throw new Error("Missing MONGO_URI in environment variables");
}

// MongoDB client and caching
let cachedClient = null;
let cachedDb = null;

async function connectToDB(dbName = "CosPassioX") {
  if (cachedClient && cachedDb) return cachedDb;

  const client = new MongoClient(URI);
  await client.connect();
  cachedClient = client;
  cachedDb = client.db(dbName);
  console.log(`✅ MongoDB connected to ${dbName}`);
  return cachedDb;
}

// Routes
app.get("/", async (req, res) => {
  try {
    const db = await connectToDB();
    const collection = db.collection("document");
    const findResult = await collection.find({}).toArray();
    res.json(findResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

app.post("/", async (req, res) => {
  try {
    const db = await connectToDB();
    const collection = db.collection("document");

    // Delete old document with same id if exists
    await collection.deleteOne({ id: req.body.id });

    const result = await collection.insertOne(req.body);
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert document" });
  }
});

app.post("/pass", async (req, res) => {
  try {
    const db = await connectToDB("CosPassioPasX");
    const collection = db.collection("document");

    const existing = await collection.findOne({ email: req.body.email });
    if (existing) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const result = await collection.insertOne(req.body);
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert account" });
  }
});

app.delete("/", async (req, res) => {
  try {
    const db = await connectToDB();
    const collection = db.collection("document");
    const deleted = await collection.deleteOne({ id: req.body.id });
    res.json({ success: true, deleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Export for Vercel
export default app;
