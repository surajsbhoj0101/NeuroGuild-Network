import User from "../models/user.model.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import quizModel from "../models/quiz.model.js";
import { checkAlreadyWhiteListed, whiteListUser } from "../services/whitelist_user_for_sbt.js";
import { getTokenUri } from "../services/get_token_uri.js";
import axios from "axios";
import { uploadToIpfs } from "../services/upload_to_pinata.js";
import { checkUserAlreadyMinted } from "../services/check_user_already_mint.js"
import { updateHolderSkill } from "../services/update_user_skill.js"


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

     
        const { skills, isVerified, ...otherUpdates } = updateData;

      

        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: walletAddress },
            { $set: otherUpdates }, 
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
            quizId: newSession._id  // <-- ADD THIS
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

        await user.save(); //.save() method using this we can change our data before saving it to database
    }
    return user;
}


export const quizCheckAllCorrect = async (req, res) => {
    const { address, skill, answers, quizId } = req.body;
    const walletAddress = address.toLowerCase();

    try {

        const latestQuiz = await quizModel.findById(quizId); // <-- CHANGE THIS

        if (!latestQuiz) {
            return res.status(404).json({ error: "No quiz session found" });
        }

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


        const attempt = await quizModel.create({
            wallet: walletAddress,
            skill,
            questions: latestQuiz.questions, // optional: store questions too
            passed: allCorrect,
        });
        let isWhiteListed = false;
        if (allCorrect) {
            const updatedUser = await handleUserSkillPass(address, skill);
            console.log("User updated or created:", updatedUser);
            const whiteList = await whiteListUser(address);
            isWhiteListed = whiteList.whiteListSuccess;
            console.log("WhiteListed ?", isWhiteListed)
        }


        res.status(200).json({
            message: allCorrect ? "All answers are correct " : "Some answers are wrong ",
            isPassed: allCorrect,
            isWhiteListed: isWhiteListed
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
};

export const checkUserPassedQuiz = async (req, res) => {
    const skill = req.query.skill;
    const address = req.query.address;
    const walletAddress = address.toLowerCase();
    console.log(address)
    try {
        const resp = await User.findOne({
            walletAddress: address.toLowerCase(),
            skills: {
                $elemMatch: { //It ensures both conditions apply to the same object inside the array.
                    name: skill,
                    quizPassed: true
                }
            }
        });

        if (resp) {
            res.status(200).json({ isPassed: true });
        } else {
            res.status(200).json({ isPassed: false });
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error });
    }
}

export async function getJsonFromIpfs(uri) {
    try {
        if (!uri) {
            console.error("No URI provided to fetch from IPFS");
            return false;
        }

        console.log("Fetching from IPFS:", uri);
        const url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");

        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            }
        });

        const json = response.data;

        console.log("JSON fetched:", json);
        return json;

    } catch (error) {
        console.error("Error fetching JSON from IPFS:", error.message);
        return false;
    }
}

export const upgradeSkill = async (req, res) => {
    const { address, skill, cid } = req.body;

    try {
        const wl = await checkAlreadyWhiteListed(address);
        if (!wl) {

            return res.status(404).json({ error: "User is not whitelisted for SBT" });
        }

        const isMinted = await checkUserAlreadyMinted(address);
        if (!isMinted.isminted) {
            return res.status(404).json({ error: "User already minted SBT" });
        }

        const tokenId = isMinted.tokenId;
        let uri;
        console.log(tokenId)
        const tokenUri = await getTokenUri(tokenId);
        console.log('got uri ', tokenUri)
        if (tokenUri) {
            const json = await getJsonFromIpfs(tokenUri);

            json.skills.push({
                name: skill,
                level: "Intermediate",
                badge: {
                    title: `${skill} skill`,
                    image: cid,
                    issuer: "NeuroGuild Network",
                    date: new Date().toISOString().split("T")[0]
                },
                skill_image: cid
            });

            const uriCid = await uploadToIpfs(json);
            uri = `ipfs://${uriCid}`;
        } else {
            const json = {
                name: "SkillSBT",
                description: "SoulBound Token representing verified skills and badges.",
                image: "ipfs://bafybeif4pnqwxql4u6cfw3ngmxlbv73zlsgxmf6gwai5un5nedbddcfvzi",
                attributes: [
                    {
                        trait_type: "Skills",
                        value: "Verified Technical Skills"
                    }
                ],
                skills: [
                    {
                        name: skill,
                        level: "Intermediate",
                        badge: {
                            title: `${skill} skill`,
                            image: cid,
                            issuer: "NeuroGuild Network",
                            date: new Date().toISOString().split("T")[0]
                        },
                        skill_image: cid
                    }
                ]
            };

            const uriCid = await uploadToIpfs(json);
            uri = `ipfs://${uriCid}`;

        }
        console.log(uri)
        const isUpdated = await updateHolderSkill(skill, address, uri);
        if (!isUpdated) {
            return res.status(500).json({ error: "Skill update failed" });
        }
        const walletAddress = address.toLowerCase()
        console.log("Done updating")
        await User.findOneAndUpdate(
            { walletAddress: walletAddress },
            {
                $set: {
                    "skills.$[elem].sbtAddress": "0x02211C2b17547BB25e20444f3A1d736445c8bCF1",
                    "skills.$[elem].quizPassed": true,
                    "skills.$[elem].minted": true,
                    "skills.$[elem].active": true,
                    isVerified: true
                }
            },
            {
                arrayFilters: [{ "elem.name": skill }], // match skill name
                new: true
            }
        );

        console.log("done")
        res.status(200).json({ success: true, message: "Skill update successful" });

    } catch (error) {
        console.log("upgradeSkill error:", error);
        res.status(500).json({ error: error.message || error });
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

//         const user = await User.findOne({
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
                message: "User has not minted an SBT yet."
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



