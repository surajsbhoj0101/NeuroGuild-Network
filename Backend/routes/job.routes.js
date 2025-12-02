import express from "express";
import { aiEnhanceJobDetails } from "../controllers/jobs.controller.js";
import { createJob } from "../controllers/jobs.controller.js";
import { fetchJobs } from "../controllers/jobs.controller.js";
import { fetchJob } from "../controllers/jobs.controller.js";
import { fetchAiScoreAndJobInteraction } from "../controllers/jobs.controller.js";
import { getJobIpfs } from "../controllers/jobs.controller.js";
import { saveJob } from "../controllers/jobs.controller.js";
import { saveBid } from "../controllers/jobs.controller.js";
import { fetchClientsJobs } from "../controllers/jobs.controller.js";
import { fetchJobBids } from "../controllers/jobs.controller.js";
import { deleteJobs } from "../controllers/jobs.controller.js";
import { rejectBid } from "../controllers/jobs.controller.js";

const jobRoutes = express.Router();

jobRoutes.post('/ai-enhancement', aiEnhanceJobDetails)
jobRoutes.post('/create-job', createJob)
jobRoutes.get('/fetch-jobs', fetchJobs)
jobRoutes.get('/fetch-job/:jobId', fetchJob)
jobRoutes.post('/fetch-ai-score-and-job-interaction', fetchAiScoreAndJobInteraction)
jobRoutes.post('/get-job-ipfs',getJobIpfs)
jobRoutes.put('/save-job',saveJob)
jobRoutes.put('/submit-bid',saveBid)
jobRoutes.get('/client-jobs/:address',fetchClientsJobs);
jobRoutes.get('/get-job-bids/:jobId',fetchJobBids)
jobRoutes.delete('/delete-job/:jobId',deleteJobs)
jobRoutes.put('/reject-bid',rejectBid)

export default jobRoutes