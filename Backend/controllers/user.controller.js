import User from "../models/user.model.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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
    const { skill } = req.params;
    const prompt = `
Generate multiple-choice questions for the skill "${skill}" in JSON format.
Use this structure for each difficulty level: 

{
  "timeLimit": 240, // seconds for basic, 360 for medium, 600 for advanced
  "questions": [
    {
      "question": "...",
      "options": ["A...", "B...", "C...", "D..."],
      "correctAnswer": "..."
    }
  ]
}

Generate exactly:
- 10 basic questions (timeLimit: 240 seconds)
- 10 medium questions (timeLimit: 360 seconds)
- 10 advanced questions (timeLimit: 600 seconds)
Return JSON with three keys: "basic", "medium", "advanced".
`;



    try {
        // The client gets the API key from the environment variable `GEMINI_API_KEY`.
        const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });


        const resultText = response.output_text; // or response.contents[0].text
        const questions = JSON.parse(resultText);
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({success:false})
    }
}