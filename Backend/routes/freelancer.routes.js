import express from "express";

import { getFreelancer } from "../controllers/freelancer.controller.js";
import { updateFreelancer } from "../controllers/freelancer.controller.js";
import { fetchQuestions } from "../controllers/freelancer.controller.js";
import { fetchSbt } from "../controllers/freelancer.controller.js";
import { isAlreadyMint } from "../controllers/freelancer.controller.js";
import { requireAuth } from "../middleware/authHttp.middleware.js";

const freelancerRoutes = express.Router();

freelancerRoutes.get("/get-freelancer", requireAuth, getFreelancer);
freelancerRoutes.put("/update-profile", requireAuth, updateFreelancer);
freelancerRoutes.get("/fetch-questions", requireAuth,fetchQuestions);
freelancerRoutes.post("/is-already-mint", requireAuth, isAlreadyMint);
freelancerRoutes.post("/fetch-sbt", requireAuth, fetchSbt);
export default freelancerRoutes;
