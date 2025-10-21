import User from "../models/user.model.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import quizModel from "../models/quiz.model.js";

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
        const cooldown = 24 * 60 * 60 * 1000;

        const alreadyPassed = await User.findOne({
            walletAddress: address.toLowerCase(),
            skills: {
                $elemMatch: {
                    name: skill,
                    quizPassed: true
                }
            }
        });

        if (alreadyPassed) {
            console.log("You already passed this quiz");
            return res.status(400).json({
                success: false,
                message: "You already passed this quiz."
            });
            
        }


        const lastSession = await quizModel.findOne({
            wallet: address.toLowerCase(),
            skill,
            createdAt: { $gte: new Date(Date.now() - cooldown) }
        });

        if (lastSession) {
            console.log("You can attempt this skill only once every 24 hours.");
            return res.status(400).json({
                success: false,
                message: "You can attempt this skill only once every 24 hours."
            });
        }

        // const prompt = `You are an AI quiz generator.Generate ** 25 multiple - choice questions ** on the topic: ${skill}.Requirements: - Divide by difficulty: 10 easy, 10 medium, 5 hard - Each question must include: - "question" - "options": array of 4 choices - "answer": correct letter(A, B, C, or D) - "difficulty" - "points": 3 for easy, 4 for medium, 6 for hard Output JSON only in this structure: { "quiz": [{ "question": "What is ...?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "B", "difficulty": "easy", "points": 3 }] }`;

        const prompt = `You are an AI quiz generator.Generate ** 5 multiple - choice questions ** on the topic: ${skill}.Requirements: - Divide by difficulty: 2 easy, 2 medium, 1 hard - Each question must include: - "question" - "options": array of 4 choices - "answer": correct letter(A, B, C, or D) - "difficulty" - "points": 3 for easy, 4 for medium, 6 for hard Output JSON only in this structure: { "quiz": [{ "question": "What is ...?", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "B", "difficulty": "easy", "points": 3 }] }`;
        const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let resultText = response.text || "";
        resultText = resultText.replace(/```json\s*|```/g, "").trim();

        let quizJSON;
        try {
            quizJSON = JSON.parse(resultText);
        } catch (err) {
            console.error("Error parsing AI response:", resultText);
            return res.status(500).json({
                success: false,
                message: "Invalid AI response format. Try again.",
            });
        }

        const newSession = new quizModel({
            wallet: address.toLowerCase(),
            skill,
            questions: quizJSON.quiz,
        });
        await newSession.save();

        const storedQuestions = quizJSON.quiz.map(({ answer, ...rest }) => rest);

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

const handleUserSkillPass = async (walletAddress, skillName) => {
    const wallet = walletAddress.toLowerCase();

    // Try to find the user
    let user = await User.findOne({ walletAddress: wallet });

    if (!user) {
        user = await User.create({
            walletAddress: wallet,
            skills: [
                {
                    name: skillName,
                    quizPassed: true,
                },
            ]
        })
    } else {
        const skillIndex = user.skills.findIndex(s => s.name === skillName);
        if (skillIndex === -1) {

            user.skills.push({
                name: skillName,
                quizPassed: true,
            });
        } else {

            user.skills[skillIndex].quizPassed = true;
        }

        await user.save();
    }
    return user;
}


export const quizCheckAllCorrect = async (req, res) => {
    const { address, skill, answers, autoSubmitted } = req.body;
    const walletAddress = address.toLowerCase();

    try {

        const latestQuiz = await quizModel
            .findOne({ wallet: walletAddress, skill })
            .sort({ createdAt: -1 });

        if (!latestQuiz) {
            return res.status(404).json({ error: "No quiz found for this user and skill" });
        }
        console.log(latestQuiz)
        const questions = latestQuiz.questions;


        let allCorrect = true;
        console.log(answers)
        for (let i = 0; i < questions.length; i++) {
            if (answers[i] !== questions[i].answer) {
                console.log(`${answers[i]} == ${questions[i].answer}`)
                allCorrect = false;
                break;
            }
        }

        // Store attempt in DB
        const attempt = await quizModel.create({
            wallet: walletAddress,
            skill,
            questions: latestQuiz.questions, // optional: store questions too
            passed: allCorrect,
        });

        if (allCorrect) {
            const updatedUser = await handleUserSkillPass(address, skill);
            console.log("User updated or created:", updatedUser);
        }


        res.status(200).json({
            message: allCorrect ? "All answers are correct " : "Some answers are wrong ",
            isPassed: allCorrect
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
};


