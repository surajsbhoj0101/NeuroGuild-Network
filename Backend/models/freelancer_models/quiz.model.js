// models/Quiz.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const quizSchema = new mongoose.Schema({
    wallet: String,
    skill: String,
    quiz_id: {
        type: String,
        default: uuidv4,
        unique: true,
    },
    questions: [{
        question: String,
        options: [String],
        answer: String,
        difficulty: String,
        points: Number
    }],
    totalPoints: Number,
    passed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});


export default mongoose.model("Quiz", quizSchema);
