import express from "express";
import { aiEnhanceJobDetails } from "../controllers/jobs.controller.js";
import { createJob } from "../controllers/jobs.controller.js";

const jobRoutes = express.Router();

jobRoutes.post('/ai-enhancement', aiEnhanceJobDetails)
jobRoutes.post('/create-job', createJob)

export default jobRoutes