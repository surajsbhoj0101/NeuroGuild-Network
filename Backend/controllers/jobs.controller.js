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
dotenv.config({ path: "./contract.env" });

const normalizeProofLinks = (proofs) => {
  if (Array.isArray(proofs)) return proofs.filter(Boolean);
  return proofs ? [proofs] : [];
};

const clientJobFetchQuery = `
query ClientJobs($client: Bytes!) {
  jobs(where: { client: $client }) {
    id
    status
    ipfsHash
    ipfsProof
    submittedAt
    createdAt

    bids {
      id
      bidder: freelancer
      amount
      createdAt
      status
      ipfsProposal: proposalIpfs

      job {
        id
        status
        ipfsHash
      }
    }
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
    bids: jobBids(
      where: { job: $jobId }
    ) {
      id
      bidder: freelancer
      amount
      status
      createdAt
      ipfsProposal: proposalIpfs
    }
  }
`;

const fetchMyJobs = `
  query MyQuery($bidder : Bytes!) {
  bids: jobBids(where: {freelancer: $bidder}) {
    status
    ipfsProposal: proposalIpfs
    createdAt
    amount
    job {
      id
      ipfsHash
      client
      status
      ipfsProof
      submittedAt
    }
  }
}
`;

const getAuthIdentity = async (req) => {
  const userId = req.user?.userId || req.userId || null;
  if (!userId) {
    return { userId: null, walletAddress: null };
  }

  const user = await User.findById(userId).select("_id wallets");
  return {
    userId: user?._id || null,
    walletAddress: user?.wallets?.toLowerCase?.() || null,
  };
};

const buildInteractionSelector = ({ userId, walletAddress, jobId }) => {
  const or = [];
  if (userId) or.push({ userId, jobId });
  if (walletAddress) or.push({ walletAddress, jobId });

  if (or.length === 0) return null;
  if (or.length === 1) return or[0];
  return { $or: or };
};

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const shortAddress = (address) => {
  if (!address) return "N/A";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const findClientByWallet = async (walletAddress) => {
  if (!walletAddress) return null;
  const pattern = new RegExp(`^${escapeRegex(walletAddress)}$`, "i");
  return Client.findOne({ walletAddress: pattern });
};

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
    const { userId, walletAddress } = await getAuthIdentity(req);
    if (!userId || !walletAddress) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findOne({ _id: userId, wallets: walletAddress });
    if (!user) {
      console.log("Unable to find the user");
      return res
        .status(404)
        .json({ success: false, message: "Unable to find the user" });
    }

    const sanitizedPayload = {
      ...(payload || {}),
      clientAddress: walletAddress,
    };

    //create ipfs
    const json = JSON.stringify(sanitizedPayload);
    const uriCid = await uploadToIpfs(json);
    const jobIpfs = `ipfs://${uriCid}`;
    console.log("got job ipfs", jobIpfs);
    res.status(200).json({
      success: true,
      ipfs: jobIpfs,
    });
  } catch (error) {
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
      }),
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

  try {
    const { walletAddress } = await getAuthIdentity(req);
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

    const clientDetails = await findClientByWallet(job.client);

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
    console.log(ipfsData)
    const jobDetails = {
      ...clientPlain,
      ...ipfsData,
      clientAddress: ipfsData?.client || job.client,
      clientId: clientPlain?.user || null,
      clientName:
        clientPlain?.companyDetails?.companyName || shortAddress(job.client),
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
    const { jobId } = req.body;
    const { userId, walletAddress } = await getAuthIdentity(req);

    if (!walletAddress || !jobId) {
      return res.status(400).json({
        success: false,
        message: "Authenticated wallet and jobId are required.",
      });
    }

    const interactionSelector = buildInteractionSelector({
      userId,
      walletAddress,
      jobId,
    });

    const [candidateProfile, jobIpfs, interaction] = await Promise.all([
      userId
        ? Freelancer.findOne({ $or: [{ user: userId }, { walletAddress }] })
        : Freelancer.findOne({ walletAddress }),
      querySubgraph(fetchJobQuery, { jobId }),
      interactionSelector ? JobInteraction.findOne(interactionSelector) : null,
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
  const { jobId } = req.body;
  const { userId, walletAddress } = await getAuthIdentity(req);

  const interactionSelector = buildInteractionSelector({
    userId,
    walletAddress,
    jobId,
  });

  if (!interactionSelector) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    const updated = await JobInteraction.findOneAndUpdate(
      interactionSelector,
      {
        $set: {
          userId,
          walletAddress,
          isSaved: true,
          savedAt: new Date(),
        },
      },
      { upsert: true, new: true },
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
  const { jobId, amount, proposal } = req.body;
  const { userId, walletAddress } = await getAuthIdentity(req);

  if (!jobId || !amount || !proposal || !walletAddress) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const interactionSelector = buildInteractionSelector({
    userId,
    walletAddress,
    jobId,
  });

  try {
    const bid = await Bid.create({
      jobId: jobId,
      bidderAddress: walletAddress,
      bidderUserId: userId,
      bidAmount: amount,
      proposal: proposal,
    });

    let updated = null;
    if (interactionSelector) {
      updated = await JobInteraction.findOneAndUpdate(
        interactionSelector,
        {
          $set: {
            userId,
            walletAddress,
            isApplied: true,
            appliedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    }

    return res.status(201).json({
      success: true,
      message: "Bid submitted successfully",
      bid,
      interaction: updated,
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
  const { payload } = req.body;
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
    const { walletAddress } = await getAuthIdentity(req);
    if (!walletAddress) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const resp = await querySubgraph(fetchMyJobs, { bidder: walletAddress });
    const bids = resp?.bids || [];

    const categorized = {
      open: [],
      inProgress: [],
      submitted: [],
      disputed: [],
      cancelled: [],
      expired: [],
      completed: [],
    };

    const buildJobPayload = async (bid) => {
      const job = bid.job;
      const clientAddress = job?.client || null;
      const workProofLinks = normalizeProofLinks(job?.ipfsProof);

      const [clientDetails, bidData, jobDetails] = await Promise.all([
        findClientByWallet(clientAddress),
        getJsonFromIpfs(bid.ipfsProposal),
        getJsonFromIpfs(job.ipfsHash),
      ]);

      console.log(bidData);

      const clientName =
        clientDetails?.companyDetails?.companyName ||
        shortAddress(clientAddress);

      return {
        jobId: job.id,
        status: job.status,
        workProofLinks,
        workProofLink: workProofLinks[workProofLinks.length - 1] || "",
        submittedAt: job?.submittedAt || null,
        bidStatus: bid?.status ? bid.status.toLowerCase() : "pending",
        createdAt: bid.createdAt,

        bidAmount: bid?.amount / 1e18,
        proposal: bidData?.proposal || "",
        milestones: bidData?.milestones || [],

        JobDetails: {
          ...jobDetails,
          budget: jobDetails?.budget,
          deadline: jobDetails?.deadline,
          clientAddress: jobDetails?.client || clientAddress,
          clientName,
          clientId: clientDetails?.user,
          clientDetails,
        },
      };
    };

    for (const bid of bids) {
      const jobStatus = bid?.job?.status;

      if (!jobStatus) continue;

      const jobPayload = await buildJobPayload(bid);
      const deadline = new Date(jobPayload.JobDetails.deadline);
      const now = new Date();

      if (jobStatus === "OPEN") {
        categorized.open.push(jobPayload);
      } else if (jobStatus === "IN_PROGRESS") {
        // Check if deadline has passed
        if (deadline < now) {
          categorized.expired.push(jobPayload);
        } else {
          categorized.inProgress.push(jobPayload);
        }
      } else if (jobStatus === "SUBMITTED") {
        categorized.submitted.push(jobPayload);
      } else if (jobStatus === "DISPUTED") {
        categorized.disputed.push(jobPayload);
      } else if (jobStatus === "CANCELLED") {
        categorized.cancelled.push(jobPayload);
      } else if (jobStatus === "COMPLETED") {
        categorized.completed.push(jobPayload);
      }
    }
    console.log(categorized);
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

export const fetchClientsJobs = async (req, res) => {
  try {
    const { walletAddress: clientAddress } = await getAuthIdentity(req);
    if (!clientAddress) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const resp = await querySubgraph(clientJobFetchQuery, {
      client: clientAddress,
    });

    const jobs = resp?.jobs || [];

    const categorized = {
      open: [],
      inProgress: [],
      completed: [],
      cancelled: [],
      disputed: [],
      submitted: [],
    };

    const buildOpenJobPayload = async (job) => {
      console.log("Came for open");
      const [ jobDetails] = await Promise.all([
        getJsonFromIpfs(job.ipfsHash),
      ]);

      return {
        jobId: job.id,
        status: job.status,
        JobDetails: {
          ...jobDetails,
          budget: jobDetails?.budget,
          deadline: jobDetails?.deadline,
          clientAddress: jobDetails?.client,
        },
      };
    };

    const buildJobPayload = async (bid, job) => {
      const workProofLinks = normalizeProofLinks(job?.ipfsProof);
      const [freelancerDetails, bidData, jobDetails] = await Promise.all([
        Freelancer.findOne({ walletAddress: bid.bidder }),
        getJsonFromIpfs(bid.ipfsProposal),
        getJsonFromIpfs(job.ipfsHash),
      ]);

      console.log("Console log ,",bid.bidder)

      return {
        jobId: job.id,
        status: job.status,
        workProofLinks,
        workProofLink: workProofLinks[workProofLinks.length - 1] || "",
        submittedAt: job?.submittedAt || null,
        createdAt: bid.createdAt,
        bidId: bid.id.split("-").pop(),
        bidAmount: Number(bid.amount) / 1e18,
        proposal: bidData?.proposal || "",
        milestones: bidData?.milestones || [],
        bidder: bid.bidder,

        JobDetails: {
          ...jobDetails,
          budget: jobDetails?.budget,
          deadline: jobDetails?.deadline,
          clientAddress: jobDetails?.client,
          freelancerId: freelancerDetails?.user,
          freelancerDetails: freelancerDetails,
        },
      };
    };

    for (const job of jobs) {
      console.log(job.bids);
      if (job.bids.length > 0) {
        for (const bid of job.bids) {
          const jobPayload = await buildJobPayload(bid, job);

          if (job.status === "OPEN") {
            categorized.open.push(jobPayload);
          } else if (job.status === "IN_PROGRESS") {
            categorized.inProgress.push(jobPayload);
          } else if (job.status === "SUBMITTED") {
            categorized.submitted.push(jobPayload);
          } else if (job.status === "COMPLETED") {
            categorized.completed.push(jobPayload);
          } else if (job.status === "CANCELLED") {
            categorized.cancelled.push(jobPayload);
          } else if (job.status === "DISPUTED") {
            categorized.disputed.push(jobPayload);
          }
        }
      } else {
        console.log("no bids");
        const jobPayload = await buildOpenJobPayload(job);
        console.log(job.status);
        if (job.status === "OPEN") {
          categorized.open.push(jobPayload);
        } else if (job.status === "IN_PROGRESS") {
          categorized.inProgress.push(jobPayload);
        } else if (job.status === "SUBMITTED") {
          categorized.submitted.push(jobPayload);
        } else if (job.status === "COMPLETED") {
          categorized.completed.push(jobPayload);
        } else if (job.status === "CANCELLED") {
          categorized.cancelled.push(jobPayload);
        } else if (job.status === "DISPUTED") {
          categorized.disputed.push(jobPayload);
        }
      }
    }

    return res.status(200).json({
      success: true,
      categorized,
    });
  } catch (error) {
    console.error("Fetch job posted by client error", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
