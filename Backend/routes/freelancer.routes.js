import express from "express";

import { getFreelancer } from "../controllers/freelancer.controller.js";
import { updateFreelancer } from "../controllers/freelancer.controller.js";
import { fetchQuestions } from "../controllers/freelancer.controller.js";
import { fetchSbt } from "../controllers/freelancer.controller.js";
import { isAlreadyMint } from "../controllers/freelancer.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const freelancerRoutes = express.Router();

freelancerRoutes.get("/get-freelancer", requireAuth, getFreelancer);
freelancerRoutes.put("/update-profile", requireAuth, updateFreelancer);
freelancerRoutes.post("/fetch-questions", fetchQuestions);
freelancerRoutes.post("/is-already-mint", isAlreadyMint);
freelancerRoutes.post("/fetch-sbt", fetchSbt);
export default freelancerRoutes;
