import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "./contract.env" });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI or MONGO_URI in environment.");
}

const RETRY_DELAY_MS = 5000;

const connectDB = async () => {
  while (true) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("MongoDB connected successfully");
      return;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      console.log(`Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

export default connectDB;
