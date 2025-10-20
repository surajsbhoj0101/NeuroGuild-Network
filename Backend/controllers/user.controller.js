import User from "../models/user.model.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import quizModel from "../models/quiz.model.js";
import quizAttemptModel from "../models/quizAttempt.model.js";

dotenv.config();
export const test = async (req, res) => {
    res.send("Hello")
}

export const getOrCreateUser = async (req, res) => {
    const { address } = req.params;

    try {
        let newUser = false;
        const walletAddress = address.toLowerCase();

        let user = await User.findOne({ walletAddress });

        if (!user) {
            user = await User.create({
                walletAddress,
                BasicInformation: {
                    name: "New User",
                    title: "",
                    bio: "",
                    location: "",
                    email: "",
                },
                ProfessionalDetails: {
                    hourlyRate: "",
                    experience: "",
                    availability: "available",
                },
                SocialLinks: {
                    github: "",
                    twitter: "",
                    linkedIn: "",
                    website: "",
                },
            });

            console.log(`New user created: ${walletAddress}`);
            newUser = true;
        } else {
            console.log(`Existing user found: ${walletAddress}`);
        }

        res.status(200).json({ success: true, user, newUser });
    } catch (error) {
        console.error("Error in getOrCreateUser:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};



export const getUser = async (req, res) => {
    const { address } = req.params;

    try {
        const walletAddress = address.toLowerCase();
        let user = await User.findOne({ walletAddress });

        if (!user) {
            console.log("User not found")
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const updateUser = async (req, res) => {

    const { address } = req.params;

    const updateData = req.body;

    console.log("Address:", address);

    try {

        const walletAddress = address.toLowerCase();


        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: walletAddress },
            { $set: updateData },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        console.log("Done");
        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ success: false, message: "Server error during update." });
    }
};

export const fetchQuestions = async (req, res) => {
    
    const { address, skill } = req.body;

    try {
        console.log("Finding. ..")
        const lastAttempt = await quizAttemptModel.findOne({
            skill,
            wallet: address.toLowerCase(),
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24 hours
        });
        console.log("Found..")
        if (lastAttempt) {
            return res.status(400).json({
                success: false,
                message: "You can attempt this skill only once every 24 hours."
            });
        }


        const prompt = `
            You are an AI quiz generator. Generate **25 multiple-choice questions** on the topic: ${skill}.

            Requirements:
            - Divide the questions by difficulty:
              - 10 easy
              - 10 medium
              - 5 hard
            - Each question must have:
              - "question": The text of the question
              - "options": An array of 4 possible answers (A, B, C, D)
              - "answer": The correct option (A, B, C, or D)
              - "difficulty": easy, medium, or hard
              - "points": 3 for easy, 4 for medium, 6 for hard

            Output format: JSON only, like this:
            {
              "quiz": [
                {
                  "question": "What is ...?",
                  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
                  "answer": "B",
                  "difficulty": "easy",
                  "points": 3
                }
              ]
            }
            Make the questions diverse, clear, and non-repetitive.
            Avoid any explanations or markdown — only return valid JSON.
        `;
        console.log("Generating ....")

        const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let resultText = response.text || "";
        resultText = resultText.replace(/```json\s*|```/g, '').trim();

        const quizJSON = JSON.parse(resultText);
        console.log("Storing ...")
        const storedQuestions = await Promise.all(
            quizJSON.quiz.map(async (q) => {
                const newQ = new quizModel({
                    skill,
                    question: q.question,
                    options: q.options,
                    answer: q.answer,
                    difficulty: q.difficulty,
                    points: q.points
                });
                await newQ.save();
                const { answer, ...questionWithoutAnswer } = q;
                return questionWithoutAnswer;
            })
        );


        await quizAttemptModel.create({
            skill,
            wallet: address.toLowerCase(),
        });


        res.status(200).json({
            success: true,
            questions: storedQuestions
        });

    } catch (error) {
        console.error("Error generating quiz:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong while generating the quiz.",
        });
    }
};
