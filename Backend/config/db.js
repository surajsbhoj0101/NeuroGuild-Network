import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://mongo:27017/NeuroGuild');
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
