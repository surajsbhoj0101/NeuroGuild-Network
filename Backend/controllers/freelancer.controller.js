import Freelancer from "../models/freelancer_models/freelancers.model.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import quizModel from "../models/freelancer_models/quiz.model.js";
import { uploadToIpfs } from "../services/upload_to_pinata.js";
import JobInteraction from "../models/job_models/jobInteraction.model.js";
import Bid from "../models/job_models/bid.model.js";
import Job from "../models/job_models/job.model.js";
import { getJsonFromIpfs } from "../services/ipfs_to_json.js";
import skillTokenizable from "../services/tokenizableSkills.js";
import {
    backendSignerIsCouncil,
    calculateSkillLevel,
    clampScore,
    getDefaultCouncilConfidence,
    getSkillLevelLabel,
    mintSkillOnChain,
    walletAlreadyHasSkill,
} from "../services/skillSbtChain.js";


dotenv.config();
dotenv.config({ path: "./contract.env" });

const QUIZ_PASS_PERCENTAGE = 60;

const getSkillEntry = (freelancer, skillName) =>
    freelancer?.skills?.find((entry) => entry.name === skillName) || null;

const ensureSkillEntry = (freelancer, skillName) => {
    let skillEntry = getSkillEntry(freelancer, skillName);
    if (!skillEntry) {
        freelancer.skills.push({ name: skillName });
        skillEntry = freelancer.skills[freelancer.skills.length - 1];
    }
    return skillEntry;
};

const buildSkillMetadata = ({
    freelancer,
    skillName,
    aiScore,
    councilConfidence,
    levelLabel,
    tokenId,
    metadataURI,
}) => ({
    name: `${skillName} Skill SBT`,
    description: `Quiz-verified ${skillName} skill credential issued by NeuroGuild.`,
    image: freelancer?.BasicInformation?.avatarUrl || "",
    attributes: [
        { trait_type: "Skill", value: skillName },
        { trait_type: "AI Score", value: aiScore },
        { trait_type: "Council Confidence", value: councilConfidence },
        { trait_type: "Level", value: levelLabel },
        { trait_type: "Issuer", value: "NeuroGuild Council" },
    ],
    skill: {
        name: skillName,
        aiScore,
        councilConfidence,
        level: levelLabel,
        tokenId,
        metadataURI,
    },
    skills: [
        {
            name: skillName,
            level: levelLabel,
            badge: {
                issuer: "NeuroGuild Council",
                date: new Date().toLocaleDateString("en-US"),
            },
        },
    ],
});
export const test = async (req, res) => {
    res.send("Hello")
}


export const getFreelancer = async (req, res) => {
    const userId = req.userId || req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized", skillTokenizable });
    }
    try {
        const freelancer = await Freelancer.findOne({ user: userId });

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
        const userId = req.userId || req.user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        //solved a big bug here
        const { isVerified, ...otherUpdates } = payload;

        const updatedUser = await Freelancer.findOneAndUpdate(
            { user: userId },
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
    const userId = req.userId || req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const freelancer = await Freelancer.findOne({ user: userId }).select("walletAddress");
        if (!freelancer?.walletAddress) {
            return res.status(404).json({ success: false, message: "Freelancer profile not found." });
        }
        const address = freelancer.walletAddress.toLowerCase();
        const skill = req.cookies?.skill_access;
        if (!skill) {
            return res.status(400).json({ success: false, message: "Skill is not selected." });
        }

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
        const skillEntry = ensureSkillEntry(user, skillName);
        skillEntry.quizPassed = true;
        skillEntry.quizPassedAt = new Date();

        await user.save();
    }
    return user;
}

export const submitQuiz = async (req, res) => {
    const userId = req.userId || req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const { quizId, answers = {}, skill } = req.body;
        if (!quizId || !skill) {
            return res.status(400).json({
                success: false,
                message: "Quiz submission is missing required data.",
            });
        }

        const freelancer = await Freelancer.findOne({ user: userId }).select(
            "walletAddress skills BasicInformation"
        );

        if (!freelancer?.walletAddress) {
            return res.status(404).json({
                success: false,
                message: "Freelancer wallet not found.",
            });
        }

        const walletAddress = freelancer.walletAddress.toLowerCase();
        const quiz = await quizModel.findOne({
            _id: quizId,
            wallet: walletAddress,
            skill,
        });

        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: "Quiz session not found.",
            });
        }

        const totalPoints = quiz.questions.reduce(
            (sum, question) => sum + Number(question.points || 0),
            0
        );
        const scoredPoints = quiz.questions.reduce((sum, question, index) => {
            const submitted = String(answers[index] || "").trim().toUpperCase();
            const expected = String(question.answer || "").trim().toUpperCase();
            return submitted === expected
                ? sum + Number(question.points || 0)
                : sum;
        }, 0);

        const aiScore = totalPoints
            ? Math.round((scoredPoints / totalPoints) * 100)
            : 0;
        const passed = aiScore >= QUIZ_PASS_PERCENTAGE;

        quiz.totalPoints = totalPoints;
        quiz.passed = passed;
        await quiz.save();

        const skillEntry = ensureSkillEntry(freelancer, skill);
        skillEntry.score = skillEntry.score || {};
        skillEntry.score.ai = skillEntry.score.ai || {};
        skillEntry.score.ai.test = aiScore;
        skillEntry.score.ai.confidence = Number((scoredPoints / Math.max(totalPoints, 1)).toFixed(2));
        skillEntry.score.final = clampScore(aiScore);
        skillEntry.lastEvaluatedAt = new Date();
        skillEntry.quizPassed = passed;
        skillEntry.quizPassedAt = passed ? new Date() : skillEntry.quizPassedAt;

        await freelancer.save();

        return res.status(200).json({
            success: true,
            isPassed: passed,
            isWhiteListed: passed,
            aiScore,
            scoredPoints,
            totalPoints,
            passThreshold: QUIZ_PASS_PERCENTAGE,
        });
    } catch (error) {
        console.error("submitQuiz error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit quiz.",
            error: error.message,
        });
    }
};

export const getSkillMintStatus = async (req, res) => {
    const userId = req.userId || req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const skillName = req.query.skill || req.cookies?.skill_access;
        if (!skillName || !skillTokenizable.includes(skillName)) {
            return res.status(400).json({
                success: false,
                message: "Valid skill is required.",
            });
        }

        const freelancer = await Freelancer.findOne({ user: userId }).select(
            "walletAddress skills BasicInformation"
        );
        if (!freelancer?.walletAddress) {
            return res.status(404).json({
                success: false,
                message: "Freelancer wallet not found.",
            });
        }

        const skillEntry = getSkillEntry(freelancer, skillName);
        const onChainMinted = await walletAlreadyHasSkill(
            freelancer.walletAddress.toLowerCase(),
            skillName
        );
        const councilReady = await backendSignerIsCouncil();

        return res.status(200).json({
            success: true,
            skill: {
                name: skillName,
                walletAddress: freelancer.walletAddress,
                quizPassed: !!skillEntry?.quizPassed,
                quizPassedAt: skillEntry?.quizPassedAt || null,
                aiScore: Number(skillEntry?.score?.ai?.test || 0),
                councilConfidence:
                    Number(skillEntry?.score?.council?.test) ||
                    getDefaultCouncilConfidence(),
                minted: !!skillEntry?.sbt?.minted || onChainMinted,
                tokenId: skillEntry?.sbt?.tokenId || null,
                metadataURI: skillEntry?.sbt?.sbtAddress || null,
                onChainMinted,
                canMint: !!skillEntry?.quizPassed && !skillEntry?.sbt?.minted && !onChainMinted,
            },
            backendCouncilReady: councilReady,
        });
    } catch (error) {
        console.error("getSkillMintStatus error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch skill mint status.",
            error: error.message,
        });
    }
};

export const mintSkillSbt = async (req, res) => {
    const userId = req.userId || req.user?.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        const { skill } = req.body;
        if (!skill || !skillTokenizable.includes(skill)) {
            return res.status(400).json({
                success: false,
                message: "Valid skill is required.",
            });
        }

        const freelancer = await Freelancer.findOne({ user: userId });
        if (!freelancer?.walletAddress) {
            return res.status(404).json({
                success: false,
                message: "Freelancer wallet not found.",
            });
        }

        const skillEntry = getSkillEntry(freelancer, skill);
        if (!skillEntry?.quizPassed) {
            return res.status(400).json({
                success: false,
                message: "Pass the quiz before minting the skill SBT.",
            });
        }

        const walletAddress = freelancer.walletAddress.toLowerCase();
        const alreadyMintedOnChain = await walletAlreadyHasSkill(walletAddress, skill);
        if (skillEntry?.sbt?.minted || alreadyMintedOnChain) {
            return res.status(400).json({
                success: false,
                message: "Skill SBT already minted for this skill.",
            });
        }

        const councilReady = await backendSignerIsCouncil();
        if (!councilReady) {
            return res.status(500).json({
                success: false,
                message: "Backend council signer is not configured to mint Skill SBTs.",
            });
        }

        const aiScore = clampScore(skillEntry?.score?.ai?.test);
        const councilConfidence =
            clampScore(skillEntry?.score?.council?.test) ||
            getDefaultCouncilConfidence();
        const level = calculateSkillLevel(aiScore, councilConfidence);
        const levelLabel = getSkillLevelLabel(level);

        const provisionalMetadata = buildSkillMetadata({
            freelancer,
            skillName: skill,
            aiScore,
            councilConfidence,
            levelLabel,
            tokenId: "pending",
            metadataURI: "",
        });

        const cid = await uploadToIpfs(provisionalMetadata);
        if (!cid) {
            throw new Error("Unable to upload Skill SBT metadata to IPFS.");
        }
        const metadataURI = `ipfs://${cid}`;

        const { tokenId, txHash, reviewerWallet } = await mintSkillOnChain({
            walletAddress,
            skillName: skill,
            aiScore,
            councilConfidence,
            metadataURI,
        });

        skillEntry.level = level;
        skillEntry.score = skillEntry.score || {};
        skillEntry.score.council = skillEntry.score.council || {};
        skillEntry.score.council.test = councilConfidence;
        skillEntry.score.final = aiScore + councilConfidence;
        skillEntry.sbt = skillEntry.sbt || {};
        skillEntry.sbt.minted = true;
        skillEntry.sbt.sbtAddress = metadataURI;
        skillEntry.sbt.tokenId = tokenId;
        skillEntry.sbt.mintedAt = new Date();
        skillEntry.sbt.mintedBy = {
            ...(skillEntry.sbt.mintedBy || {}),
            wallet: reviewerWallet,
        };
        await freelancer.save();

        return res.status(200).json({
            success: true,
            message: "Skill SBT minted successfully.",
            skill: {
                name: skill,
                tokenId,
                metadataURI,
                txHash,
                level: levelLabel,
                aiScore,
                councilConfidence,
            },
        });
    } catch (error) {
        console.error("mintSkillSbt error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to mint Skill SBT.",
        });
    }
};




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
    const userId = req.userId || req.user?.userId;
    try {
        const skillName = req.body?.skill || req.query?.skill || req.cookies?.skill_access;
        if (!skillName || !skillTokenizable.includes(skillName)) {
            return res.status(400).json({
                success: false,
                message: "Valid skill is required.",
            });
        }

        const freelancer = await Freelancer.findOne({ user: userId }).select("walletAddress skills");
        const address = freelancer?.walletAddress?.toLowerCase();
        if (!address || !freelancer) {
            return res.status(404).json({ success: false, message: "Freelancer wallet not found." });
        }

        const skillEntry = getSkillEntry(freelancer, skillName);
        const onChainMinted = await walletAlreadyHasSkill(address, skillName);

        return res.status(200).json({
            success: true,
            isMintedSuccess: !!skillEntry?.sbt?.minted || onChainMinted,
            tokenId: skillEntry?.sbt?.tokenId || null,
        });
    } catch (error) {
        console.log("Error checking is minted: ", error)
        return res.status(500).json({ success: false, error: error.message })
    }
}

export const fetchSbt = async (req, res) => {
    const userId = req.userId || req.user?.userId;

    try {
        const freelancer = await Freelancer.findOne({ user: userId }).select("walletAddress skills");
        const address = freelancer?.walletAddress?.toLowerCase();
        if (!address || !freelancer) {
            return res.status(404).json({
                success: false,
                message: "Freelancer wallet not found."
            });
        }

        const mintedSkills = (freelancer.skills || [])
            .filter((skill) => skill?.sbt?.minted)
            .map((skill) => ({
                name: skill.name,
                level: getSkillLevelLabel(skill.level),
                tokenId: skill?.sbt?.tokenId || "",
                metadataURI: skill?.sbt?.sbtAddress || "",
                badge: {
                    issuer: "NeuroGuild Council",
                    date: skill?.sbt?.mintedAt
                        ? new Date(skill.sbt.mintedAt).toLocaleDateString("en-US")
                        : "Pending",
                },
            }));


        return res.status(200).json({
            success: true,
            sbt: {
                skills: mintedSkills,
            },
            message: "Skill SBT data fetched successfully."
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
