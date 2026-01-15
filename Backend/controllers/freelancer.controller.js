import Freelancer from "../models/freelancer_models/freelancers.model.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import quizModel from "../models/freelancer_models/quiz.model.js";
import { getTokenUri } from "../services/get_token_uri.js";
import axios from "axios";
import { uploadToIpfs } from "../services/upload_to_pinata.js";
import { checkUserAlreadyMinted } from "../services/check_user_already_mint.js"
import JobInteraction from "../models/job_models/jobInteraction.model.js";
import Bid from "../models/job_models/bid.model.js";
import Job from "../models/job_models/job.model.js";
import { getJsonFromIpfs } from "../services/ipfs_to_json.js";
import skillTokenizable from "../services/tokenizableSkills.js";


dotenv.config();
export const test = async (req, res) => {
    res.send("Hello")
}


export const getFreelancer = async (req, res) => {
    const walletAddress = req.walletAddress?.toLowerCase();
    try {
        const freelancer = await Freelancer.findOne({ walletAddress });

        if (!freelancer) {
            console.log("Freelancer not found");
            return res.status(404).json({ success: false, message: "Freelancer not found", skillTokenizable: skillTokenizable });
        }

        res.status(200).json({ success: true, freelancer: freelancer, skillTokenizable: skillTokenizable });
    } catch (error) {
        console.error("Error fetching freelancer:", error);
        res.status(500).json({ success: false, message: "Server error", skillTokenizable: skillTokenizable });
    }
};



export const updateFreelancer = async (req, res) => {


    const { payload } = req.body;


    try {
        const walletAddress = req.walletAddress?.toLowerCase();

        //solved a big bug here
        const { isVerified, ...otherUpdates } = payload;

        const updatedUser = await Freelancer.findOneAndUpdate(
            { walletAddress: walletAddress },
            { $set: otherUpdates },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Freelancer not found" });
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

        const alreadyPassed = await Freelancer.findOne({
            walletAddress: address.toLowerCase(),
            skills: {
                $elemMatch: { //It ensures both conditions apply to the same object inside the array.
                    name: skill,
                    quizPassed: true
                }
            }
        });

        console.log("Checked already passed")

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
            createdAt: { $gte: new Date(Date.now() - cooldown) }//$gte: greater than or equal
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
            questions: storedQuestions,
            quizId: newSession._id
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

    let user = await Freelancer.findOne({ walletAddress: wallet });

    if (!user) {
        user = await Freelancer.create({
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

        await user.save(); //.save() method using this we can change our data before saving it to database
    }
    return user;
}




// export const checkUserVerified = async (req, res) => {
//     try {

//         const address = req.query.address;
//         if (!address) {
//             return res.status(400).json({ error: "Address is required" });
//         }

//         const walletAddress = address.toLowerCase();
//         console.log(walletAddress)

//         const user = await Freelancer.findOne({
//             walletAddress: walletAddress,
//             isVerified: true
//         });

//         if (!user) {

//             return res.status(200).json({ isVerified: false });
//         }


//         return res.status(200).json({ isVerified: true });

//     } catch (error) {
//         console.error("Error checking user verification:", error);
//         return res.status(500).json({ error: "Server error" });
//     }
// };

export const isAlreadyMint = async (req, res) => {
    const { address } = req.body;
    try {
        const isMinted = await checkUserAlreadyMinted(address);
        console.log(isMinted)
        return res.status(200).json({ isMintedSuccess: isMinted.isminted })
    } catch (error) {
        console.log("Error checking is minted: ", error)
        return res.status(500).json({ error: error })
    }
}

export const fetchSbt = async (req, res) => {
    const { address } = req.body;

    try {
        const isMinted = await checkUserAlreadyMinted(address);


        if (!isMinted?.isminted) {
            return res.status(404).json({
                success: false,
                message: "Freelancer has not minted an SBT yet."
            });
        }

        const tokenId = isMinted.tokenId;
        if (!tokenId) {
            return res.status(400).json({
                success: false,
                message: "Token ID not found for this address."
            });
        }


        const tokenUri = await getTokenUri(tokenId);


        if (!tokenUri || tokenUri === false) {
            return res.status(200).json({
                success: true,
                sbt: null,
                message: "No token URI found for this token."
            });
        }


        const json = await getJsonFromIpfs(tokenUri);


        return res.status(200).json({
            success: true,
            sbt: json || null,
            message: "SBT data fetched successfully."
        });

    } catch (error) {
        console.error("fetchSbt error:", error.message);


        return res.status(500).json({
            success: false,
            message: "Failed to fetch SBT data.",
            error: error.message
        });
    }
};


