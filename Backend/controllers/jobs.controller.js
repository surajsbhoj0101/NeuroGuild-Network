import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import jobModel from "../models/job_models/job.model.js";
import Client from "../models/client_models/clients.model.js";
import Freelancer from "../models/freelancer_models/freelancers.model.js";
import { uploadToIpfs } from "../services/upload_to_pinata.js";
import JobInteraction from "../models/job_models/jobInteraction.model.js";
import Bid from "../models/job_models/bid.model.js";
import { GraphQLClient, gql } from "graphql-request";
import { querySubgraph } from "../services/subgraphClient.js";
import { getJsonFromIpfs } from "../services/ipfs_to_json.js";
import { json } from "express";

dotenv.config();

const clientJobFetchQuery = `
  query GetMyJobs($client: Bytes!){
    jobs(where: {client: $client}) {
      budget
      client
      createdAt
      bidDeadline
      expireDeadline
      status
      id
      ipfsHash
      freelancer
    }
  }
`;

const fetchOpenJobsQuery = `
  query GetOpenJobs($status: JobStatus){
    jobs(where: {status: $status}){
      id
      client
      ipfsHash
      budget
      createdAt
      bidDeadline
      expireDeadline
    }
  }
`;

const fetchJobQuery = `
  query GetJobById($jobId: ID!) {
    jobs(where: { id: $jobId }) {
      id
      client
      ipfsHash
      status
      budget
      bidDeadline
      expireDeadline
      createdAt
    }
  }
`;

const fetchOpenJobBids = `
  query GetBidsByJob($jobId: ID!) {
    bids(
      where: { job: $jobId }
    ) {
      id
      bidder
      amount
      status
      createdAt
      ipfsProposal
    }
  }
`;

const fetchMyJobs = `
  query MyQuery($bidder : Bytes!) {
  bids(where: {bidder: $bidder}) {
    status
    ipfsProposal
    createdAt
    amount
    job {
      id
      ipfsHash
      client
      status
    }
  }
}
`;

export const aiEnhanceJobDetails = async (req, res) => {
  const { payload } = req.body;
  console.log(payload);

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
      console.log("client address required");
      return res
        .status(400)
        .json({ success: false, message: "clientAddress is required" });
    }

    const walletAddress = payload.clientAddress.toLowerCase();
    console.log(walletAddress);

    const user = await User.findOne({ wallets: walletAddress });
    if (!user) {
      console.log("Unable to find the user");
      return res
        .status(404)
        .json({ success: false, message: "Unable to find the user" });
    }

    //create ipfs
    const json = JSON.stringify(payload);
    const uriCid = await uploadToIpfs(json);
    const jobIpfs = `ipfs://${uriCid}`;
    console.log("got job ipfs", jobIpfs);
    res.status(200).json({
      success: true,
      ipfs: jobIpfs,
    });
  } catch {
    console.log("Error in creating job", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error });
  }
};

//Backend
export const fetchJobs = async (req, res) => {
  try {
    const openJobs = await querySubgraph(fetchOpenJobsQuery, {
      status: "OPEN",
    });

    const jobs = await Promise.all(
      openJobs.jobs.map(async (job) => {
        const data = await getJsonFromIpfs(job.ipfsHash);
        const clientDetails = await Client.findOne({
          walletAddress: job.client,
        });
        return {
          ...data,
          jobId: job.id,
          clientDetails: clientDetails,
        };
      })
    );

    console.log("jobs:", jobs);

    const filteredJobs = jobs.filter((job) => {
      if (!job.deadline) return false;

      return new Date(job.deadline).getTime() >= Date.now();
    });

    console.log("Filtered Jobs: ", filteredJobs);

    res.status(200).json({ success: true, jobs: filteredJobs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Job fetching failed" });
  }
};

export const fetchJob = async (req, res) => {
  const { jobId } = req.params;
  const walletAddress = req.user?.walletAddress?.toLowerCase();

  try {
    if (!jobId) {
      return res.status(400).json({
        isFound: false,
        error: "jobId is required",
      });
    }

    const jobIpfs = await querySubgraph(fetchJobQuery, { jobId });
    const job = jobIpfs?.jobs?.[0];

    if (!job) {
      return res.status(404).json({
        isFound: false,
        error: "Job not found",
      });
    }

    const bidsResult = await querySubgraph(fetchOpenJobBids, {
      jobId: job.id,
    });

    const bids = bidsResult?.bids || [];
    const totalBids = bids.length;

    const isApplied = walletAddress
      ? bids.some((b) => b.bidder.toLowerCase() === walletAddress)
      : false;

    const clientDetails = await Client.findOne({
      walletAddress: job.client.toLowerCase(),
    });

    const clientPlain = clientDetails
      ? clientDetails.toObject({ virtuals: false })
      : {};

    const ipfsData = await getJsonFromIpfs(job.ipfsHash);

    if (!ipfsData) {
      return res.status(500).json({
        isFound: false,
        error: "Failed to fetch job metadata from IPFS",
      });
    }

    const jobDetails = {
      ...clientPlain,
      ...ipfsData,
    };

    return res.status(200).json({
      isFound: true,
      jobDetails,
      totalBids,
    });
  } catch (error) {
    console.error("fetchJob error:", error);

    return res.status(500).json({
      isFound: false,
      error: error.message || "Internal Server Error",
    });
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

    const [candidateProfile, jobIpfs, interaction] = await Promise.all([
      Freelancer.findOne({ walletAddress }),
      querySubgraph(fetchJobQuery, { jobId }),
      JobInteraction.findOne({ walletAddress, jobId }),
    ]);

    const job = jobIpfs?.jobs?.[0];

    if (!candidateProfile || !job) {
      return res.status(404).json({
        success: false,
        message: "Candidate or Job not found.",
      });
    }

    const jobDescription = await getJsonFromIpfs(job.ipfsHash);

    if (!jobDescription) {
      return res.status(404).json({
        success: false,
        message: "Job description not found.",
      });
    }

    const isSaved = interaction?.isSaved ?? false;

    const bidsResult = await querySubgraph(fetchOpenJobBids, {
      jobId: job.id,
    });

    const bids = bidsResult?.bids || [];

    const isApplied = walletAddress
      ? bids.some((b) => b.bidder.toLowerCase() === walletAddress)
      : false;

    let aiScore = null;
    let aiAvailable = false;

    try {
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

      const ai = new GoogleGenAI({
        apiKey: process.env.AI_API_KEY,
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const cleaned = response.text.replace(/```json|```/g, "").trim();

      aiScore = JSON.parse(cleaned);
      aiAvailable = true;
    } catch (aiError) {
      console.warn("AI score generation failed:", aiError.message);
    }

    return res.status(200).json({
      success: true,
      aiAvailable,
      aiScore,
      isSaved,
      isApplied,
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
          savedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: "Job saved successfully",
      data: updated,
    });
  } catch (error) {
    console.error("saveJob error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save job",
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
      proposal: proposal,
    });

    const updated = await JobInteraction.findOneAndUpdate(
      { walletAddress, jobId },
      {
        $set: {
          isApplied: true,
          appliedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Bid submitted successfully",
      bid,
      interaction: updated,
      updatedJob: updatedJob,
    });
  } catch (error) {
    console.error("saveBid error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const fetchClientsJobs = async (req, res) => {
  const { address } = req.params;
  const clientAddress = address.toLowerCase();

  try {
    const jobs = await querySubgraph(clientJobFetchQuery, {
      client: clientAddress,
    });

    console.log(jobs);
    res.status(200).json({ success: true, jobs: jobs });
  } catch (error) {
    console.error("Fetch job posted by client error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const fetchJobBids = async (req, res) => {
  const { jobId } = req.params;
  console.log(jobId);
  try {
    const bids = await Bid.find({ jobId })
      .populate({ path: "FreelancerDetails" })
      .lean({ virtuals: true });
    console.log(bids);
    res.status(200).json({ success: true, bids: bids });
  } catch (error) {
    console.error("Fetch Bids error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const fetchProposalIpfs = async (req, res) => {
  const {payload } = req.body;
  try {
    const json = JSON.stringify(payload);
    const uriCid = await uploadToIpfs(json);
    const proposalIpfs = `ipfs://${uriCid}`;
    console.log("got job ipfs", proposalIpfs);
    res.status(200).json({
      success: true,
      ipfs: proposalIpfs,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const fetchFreelancerJobs = async (req, res) => {
  try {
    const { address } = req.body;
    const walletAddress = address.toLowerCase();
    const resp = await querySubgraph(fetchMyJobs, { bidder: walletAddress });
    const bids = resp?.bids || [];

    const categorized = {
      open: [],
      inProgress: [],
      completed: [],
    };

    const buildJobPayload = async (bid) => {
      const job = bid.job;

      const [clientDetails, bidData, jobDetails] = await Promise.all([
        Client.findOne({ walletAddress: job.client }),
        getJsonFromIpfs(bid.ipfsProposal),
        getJsonFromIpfs(job.ipfsHash),
      ]);
     
      return {
        jobId: job.id,
        status: job.status,
        createdAt: bid.createdAt,

        bidAmount: bid?.amount/ 1e18,
        proposal: bidData?.payload?.proposal || "",
        milestones: bidData?.milestones || [],

        JobDetails: {
          ...jobDetails,
          budget: jobDetails?.budget,
          deadline: jobDetails?.deadline,
          clientAddress: jobDetails?.client,
          clientDetails,
        },
      };
    };

    for (const bid of bids) {
      const jobStatus = bid?.job?.status;

      if (!jobStatus) continue;

      const jobPayload = await buildJobPayload(bid);

      if (jobStatus === "OPEN") {
        categorized.open.push(jobPayload);
      } else if (jobStatus === "IN_PROGRESS") {
        categorized.inProgress.push(jobPayload);
      } else if (jobStatus === "COMPLETED") {
        categorized.completed.push(jobPayload);
      }
    }
    console.log(categorized)
    return res.status(200).json({
      success: true,
      categorized,
    });
  } catch (error) {
    console.error("fetchFreelancerJobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch freelancer jobs",
    });
  }
};
