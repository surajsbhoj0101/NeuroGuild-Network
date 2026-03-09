import express from 'express'
import { requireAuth } from "../middleware/authHttp.middleware.js";
import { fetchProposals } from "../controllers/governance.controller.js";

const governanceRoutes  = express.Router();

governanceRoutes.get('/fetch-proposals',requireAuth, fetchProposals );

export default governanceRoutes;