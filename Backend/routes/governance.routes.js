import express from 'express'
import { requireAuth } from "../middleware/authHttp.middleware.js";
import { fetchProposalById, fetchProposals } from "../controllers/governance.controller.js";

const governanceRoutes  = express.Router();

governanceRoutes.get('/fetch-proposals',requireAuth, fetchProposals );
governanceRoutes.get('/proposal/:id', requireAuth, fetchProposalById);

export default governanceRoutes;
