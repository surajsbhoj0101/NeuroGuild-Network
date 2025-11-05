import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Job from "../models/job_models/job.model.js";
import User from "../models/user.model.js";
import jobModel from "../models/job_models/job.model.js";

dotenv.config();

export const aiEnhanceJobDetails = async (req, res) => {
  const { payload } = req.body;
  console.log(payload)

  const prompt = `You are a professional job posting enhancement model specialized in improving gig listings for a technical freelancing platform called NeuroGuild.

STRICT INSTRUCTIONS (do not break them):
- Return ONLY valid JSON.
- Do NOT include markdown headings, bullet characters (*, -, #), or code fences inside any field.
- The description must be plain text paragraphs, no lists.
- Skills must be simple string items.
- If a field is missing, leave it empty and do NOT create new factual details.
- Never wrap output in markdown fences.

Your task:
- Make the job title clearer and more attractive.
- Improve the job description to be structured and professional using plain text sentences only.
- Normalize the skills:
  - Remove duplicates
  - Fix typos
  - Add 1–2 implied skills if helpful
- Keep budget, deadline, experienceLevel unchanged.
- Do NOT create unrealistic requirements.

Return JSON ONLY in this structure:

{
  "enhanced": {
    "title": "",
    "jobDescription": "",
    "skills": [],
    "experienceLevel": "${payload.experienceLevel}",
    "deadline": "${payload.deadline}",
    "budget": ${payload.budget}
  },
  "notes": []
}

Raw Job Payload:
${JSON.stringify(payload)}
`;


  try {
    const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let resultText = response.text;

    resultText = resultText.replace(/```json|```/g, "").trim();

    let jobDetailsJSON;
    try {
      jobDetailsJSON = JSON.parse(resultText);
    } catch (err) {
      console.error("Error parsing AI response:", resultText);
      return res.status(500).json({
        success: false,
        message: "Invalid AI response format. Try again.",
      });
    }

    return res.status(200).json({
      success: true,
      enhanced: jobDetailsJSON.enhanced,
      notes: jobDetailsJSON.notes || [],
    });

  } catch (err) {
    console.error("AI Enhancement Error:", err);
    return res.status(500).json({
      success: false,
      message: "AI enhancement service failed!",
    });
  }
};

export const createJob = async (req, res) => {
  const { payload } = req.body;

  try {

    if (!payload?.clientAddress) {
      console.log("client address required")
      return res.status(400).json({ success: false, message: "clientAddress is required" });
    }

    const walletAddress = payload.clientAddress.toLowerCase();
    console.log(walletAddress)
    const user = await User.findOne({ wallets: walletAddress });
    if (!user) {
      console.log("Unable to find the user")
      return res.status(404).json({ success: false, message: "Unable to find the user" });

    }
    console.log("creating job ...")
    payload.client = user._id;
    console.log("creating job ...")
    const job = await Job.create(payload);

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
    });

  } catch (error) {
    console.log("Error in creating job", error);
    return res.status(500).json({ success: false, message: "Server error", error });
  }
}

export const fetchJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate({
      path: "clientDetails",
      select: "companyDetails.logoUrl companyDetails.companyName stats.averageRating"
    });

    res.status(200).json({ success: true, jobs: jobs })
  } catch (error) {
    res.status(500).json({ success: false, message: "Job fetching failed" })
  }
}

export const fetchJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    const job = await Job.findOne({ jobId }).populate({
      path: "clientDetails",
      select: "companyDetails.logoUrl companyDetails.companyName stats.averageRating"
    });

    if (!job) {
      return res.status(404).json({ isFound: false, message: "Job not found", jobId: jobId });
    }

    res.status(200).json({ isFound: true, jobDetails: job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

