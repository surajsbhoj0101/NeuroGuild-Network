// models/QuizAttempt.js
import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema({
    skill: String,
    wallet: String, // the user's wallet address
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("QuizAttempt", quizAttemptSchema);
