import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import Job from "../models/job_models/job.model.js";
import User from "../models/user.model.js";
import jobModel from "../models/job_models/job.model.js";
import Client from "../models/client_models/clients.model.js"
import Freelancer from "../models/freelancer_models/freelancers.model.js";
import { uploadToIpfs } from "../services/upload_to_pinata.js";
import JobInteraction from "../models/job_models/jobInteraction.model.js";
import Bid from "../models/job_models/bid.model.js";

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
    "completion": ${payload.completion}
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

export const getJobIpfs = async (req, res) => {
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

    //create ipfs
    const json = JSON.stringify(payload);
    const uriCid = await uploadToIpfs(json);
    const jobIpfs = `ipfs://${uriCid}`;
    console.log('got job ipfs', jobIpfs)
    res.status(200).json({
      success: true, ipfs: jobIpfs
    })

  } catch {
    console.log("Error in creating job", error);
    return res.status(500).json({ success: false, message: "Server error", error });
  }
}

//onchain

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
//Backend
export const fetchJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate({
      path: "clientDetails",
      select: "companyDetails.logoUrl companyDetails.companyName stats.averageRating"
    });

    const now = new Date();

    const filteredJobs = jobs.filter(job =>
      job.status === "open" &&
      job.deadline &&
      new Date(job.deadline) >= now
    );

    res.status(200).json({ success: true, jobs: filteredJobs })
  } catch (error) {
    res.status(500).json({ success: false, message: "Job fetching failed" })
  }
}

export const fetchJob = async (req, res) => {
  const { jobId } = req.params;


  try {
    const job = await Job.findOne({ jobId }).populate({
      path: "clientDetails",
      select: "companyDetails.logoUrl walletAddress companyDetails.location companyDetails.companyName stats.averageRating "
    });


    const clientAddress = job.clientAddress;

    //Used to Get all jobs posted by this client
    const jobsByClient = await Job.find({
      clientAddress: clientAddress
    });

    const categorized = {
      open: jobsByClient.filter(j => j.status === "open"),
      inProgress: jobsByClient.filter(j => j.status === "in-progress"),
      completed: jobsByClient.filter(j => j.status === "completed"),
      cancelled: jobsByClient.filter(j => j.status === "cancelled"),
    };



    if (!job) {
      return res.status(404).json({ isFound: false, message: "Job not found", jobId: jobId });
    }

    res.status(200).json({ isFound: true, jobDetails: job, categorized: categorized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchAiScoreAndJobInteraction = async (req, res) => {
  try {
    const { address, jobId } = req.body;
    const walletAddress = address?.toLowerCase();


    if (!walletAddress || !jobId) {
      return res.status(400).json({
        success: false,
        message: "Both address and jobId are required.",
      });
    }

    const [candidateProfile, jobDescription, interaction] = await Promise.all([
      Freelancer.findOne({ walletAddress }),
      Job.findOne({ jobId }),
      JobInteraction.findOne({ walletAddress, jobId })
    ]);

    if (!candidateProfile || !jobDescription) {
      return res.status(404).json({
        success: false,
        message: "Candidate or Job not found.",
      });
    }


    const isSaved = interaction?.isSaved || false;
    const isApplied = interaction?.isApplied || false;

    const prompt = `
      You are an AI recruitment assistant.
      Evaluate how well a candidate fits the given job description.

      Provide a match score from 0 to 100 and explain the key strengths and weaknesses.

      Job Description:
      ${JSON.stringify(jobDescription, null, 2)}

      Candidate Profile:
      ${JSON.stringify(candidateProfile, null, 2)}

      Output JSON format:
      {
        "match_score": number,
        "strengths": ["skill1", ...],
        "gaps": ["gap1", ...],
        "summary": "One-sentence summary"
      }
    `;


    const ai = new GoogleGenAI({ apiKey: process.env.AI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let resultText = response.text;
    resultText = resultText.replace(/```json|```/g, "").trim();

    let scoreDetailsJSON;
    try {
      scoreDetailsJSON = JSON.parse(resultText);

    }
    catch (err) {
      console.error("AI output error:", resultText); return res.status(500).json({ success: false, message: "Invalid AI response format. Please try again.", });
    }

    console.log()

    return res.status(200).json({
      success: true,

      aiScore: scoreDetailsJSON,
      isSaved,
      isApplied
    });

  } catch (error) {
    console.error("fetchAiScore Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const saveJob = async (req, res) => {
  const { address, jobId } = req.body;
  const walletAddress = address?.toLowerCase();

  try {
    const updated = await JobInteraction.findOneAndUpdate(
      { walletAddress, jobId },
      {
        $set: {
          isSaved: true,
          savedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Job saved successfully",
      data: updated
    });

  } catch (error) {
    console.error("saveJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save job"
    });
  }
};

export const saveBid = async (req, res) => {
  const { jobId, amount, proposal, address } = req.body;

  if (!jobId || !amount || !proposal || !address) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const walletAddress = address.toLowerCase();

  try {

    const bid = await Bid.create({
      jobId: jobId,
      bidderAddress: walletAddress,
      bidAmount: amount,
      proposal: proposal
    });


    const updated = await JobInteraction.findOneAndUpdate(
      { walletAddress, jobId },
      {
        $set: {
          isApplied: true,
          appliedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );

    const updatedJob = await Job.findOneAndUpdate(
      { jobId },
      { $inc: { proposalsCount: 1 } },
      { new: true }
    );


    return res.status(201).json({
      success: true,
      message: "Bid submitted successfully",
      bid,
      interaction: updated,
      updatedJob: updatedJob
    });

  } catch (error) {
    console.error("saveBid error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

export const fetchClientsJobs = async (req, res) => {
  const { address } = req.params;
  const clientAddress = address.toLowerCase();

  try {
    const jobs = await Job.find({ clientAddress });
    res.status(200).json({ success: true, jobs: jobs })
  } catch (error) {
    console.error("Fetch job posted by client error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

export const fetchJobBids = async (req, res) => {
  const { jobId } = req.params;
  console.log(jobId)
  try {
    const bids = await Bid.find({ jobId })
      .populate({ path: "FreelancerDetails" }).lean({ virtuals: true });
    console.log(bids)
    res.status(200).json({ success: true, bids: bids })
  } catch (error) {
    console.error("Fetch Bids error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
}

export const deleteJobs = async (req, res) => {
  console.log("came to delete")
  const { jobId } = req.params;

  try {

    const deletedJobs = await Job.findOneAndDelete({ jobId });
    if (!deletedJobs) {
      return res.status(404).json({ message: "Job not found" });
    }

    await Bid.deleteMany({ jobId });

    res.json({ success: true, message: "Job and its bids deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const rejectBid = async (req, res) => {
  const { bidId, jobId } = req.body;
  console.log("Came to reject")
  try {
    const rejected = await Bid.findOneAndUpdate(
      { _id: bidId, jobId },
      { $set: { status: "rejected" } },
      { new: true }
    );

    if (!rejected) {
      return res.status(404).json({ message: "Bid not found" });
    }

    res.json({ message: "Bid rejected", bid: rejected });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// export const acceptBid = async() =>{

// }




// Bid.find({ bidderAddress })
// .populate({
//   path: "BidDetails",
//   populate: {
//     path: "FreelancerDetails",
//   }
// }).lean({ virtuals: true });



