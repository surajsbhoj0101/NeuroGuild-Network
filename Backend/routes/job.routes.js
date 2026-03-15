import express from "express";
import { aiEnhanceJobDetails } from "../controllers/jobs.controller.js";
import { fetchJobs } from "../controllers/jobs.controller.js";
import { fetchJob } from "../controllers/jobs.controller.js";
import { fetchAiScoreAndJobInteraction } from "../controllers/jobs.controller.js";
import { getJobIpfs } from "../controllers/jobs.controller.js";
import { saveJob } from "../controllers/jobs.controller.js";
import { saveBid } from "../controllers/jobs.controller.js";
import { fetchClientsJobs } from "../controllers/jobs.controller.js";
import { fetchJobBids } from "../controllers/jobs.controller.js";
import { fetchProposalIpfs } from "../controllers/jobs.controller.js";
import { fetchFreelancerJobs } from "../controllers/jobs.controller.js";
import { fetchCompletedJobsForWallet } from "../controllers/jobs.controller.js";
import { fetchHomepageSnapshot } from "../controllers/jobs.controller.js";
import { requireAuth } from "../middleware/authHttp.middleware.js";

const jobRoutes = express.Router();

jobRoutes.post("/ai-enhancement", aiEnhanceJobDetails);
jobRoutes.get("/fetch-jobs", fetchJobs);
jobRoutes.get("/homepage-snapshot", fetchHomepageSnapshot);
jobRoutes.get("/fetch-job/:jobId", requireAuth, fetchJob);
jobRoutes.post(
  "/fetch-ai-score-and-job-interaction",
  requireAuth,
  fetchAiScoreAndJobInteraction
);
jobRoutes.post("/get-job-ipfs", requireAuth, getJobIpfs);
jobRoutes.put("/save-job", requireAuth, saveJob);
jobRoutes.put("/submit-bid", requireAuth, saveBid);
jobRoutes.get("/get-job-bids/:jobId", fetchJobBids);
jobRoutes.post("/get-bid-proposal-ipfs", fetchProposalIpfs);
jobRoutes.get("/completed-jobs/:wallet", fetchCompletedJobsForWallet);
jobRoutes.get("/fetch-freelancer-jobs",requireAuth, fetchFreelancerJobs);
jobRoutes.get("/fetch-client-jobs",requireAuth, fetchClientsJobs);

export default jobRoutes;
