import express from "express";
import { aiEnhanceJobDetails } from "../controllers/jobs.controller.js";
import { createJob } from "../controllers/jobs.controller.js";
import { fetchJobs } from "../controllers/jobs.controller.js";

const jobRoutes = express.Router();

jobRoutes.post('/ai-enhancement', aiEnhanceJobDetails)
jobRoutes.post('/create-job', createJob)
jobRoutes.get('/fetch-jobs',fetchJobs)

export default jobRoutes