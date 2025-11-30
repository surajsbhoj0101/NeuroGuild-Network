import express from "express";

import { getFreelancer } from "../controllers/freelancer.controller.js";
import { updateFreelancer } from "../controllers/freelancer.controller.js";
import { fetchQuestions } from "../controllers/freelancer.controller.js";
import { quizCheckAllCorrect } from "../controllers/freelancer.controller.js";
import { checkUserPassedQuiz } from "../controllers/freelancer.controller.js";
import { upgradeSkill } from "../controllers/freelancer.controller.js";
import { fetchSbt } from "../controllers/freelancer.controller.js";
import { isAlreadyMint } from "../controllers/freelancer.controller.js";
import { fetchFreelancerDashboard } from "../controllers/freelancer.controller.js";

const freelancerRoutes = express.Router()

freelancerRoutes.post('/get-freelancer', getFreelancer)
freelancerRoutes.put('/update-profile', updateFreelancer)
freelancerRoutes.post('/fetch-questions', fetchQuestions)
freelancerRoutes.post('/submit-quiz', quizCheckAllCorrect)
freelancerRoutes.get('/check-user-passed', checkUserPassedQuiz)
freelancerRoutes.put('/upgrade-skill', upgradeSkill)
freelancerRoutes.post('/is-already-mint', isAlreadyMint);
freelancerRoutes.post('/fetch-sbt', fetchSbt)
freelancerRoutes.get('/dashboard/:address', fetchFreelancerDashboard)


export default freelancerRoutes;