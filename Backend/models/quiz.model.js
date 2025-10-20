// models/Quiz.js
import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    skill: String,
    question: String,
    options: [String],
    answer: String,        // store the correct answer
    difficulty: String,
    points: Number
});

export default mongoose.model("Quiz", quizSchema);
