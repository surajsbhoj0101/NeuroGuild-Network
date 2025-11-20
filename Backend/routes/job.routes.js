import express from "express";
import { aiEnhanceJobDetails } from "../controllers/jobs.controller.js";
import { createJob } from "../controllers/jobs.controller.js";
import { fetchJobs } from "../controllers/jobs.controller.js";
import { fetchJob } from "../controllers/jobs.controller.js";
import { fetchAiScore } from "../controllers/jobs.controller.js";
import { getJobIpfs } from "../controllers/jobs.controller.js";

const jobRoutes = express.Router();

jobRoutes.post('/ai-enhancement', aiEnhanceJobDetails)
jobRoutes.post('/create-job', createJob)
jobRoutes.get('/fetch-jobs', fetchJobs)
jobRoutes.get('/fetch-job/:jobId', fetchJob)
jobRoutes.post('/fetch-ai-score', fetchAiScore)
jobRoutes.post('/get-job-ipfs',getJobIpfs)

export default jobRoutes