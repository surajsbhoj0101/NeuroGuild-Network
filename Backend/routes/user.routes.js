import express from "express";
import { getUser } from "../controllers/user.controller.js";
import { updateUser } from "../controllers/user.controller.js";
import { test } from "../controllers/user.controller.js";
import { getOrCreateUser } from "../controllers/user.controller.js";
import { fetchQuestions } from "../controllers/user.controller.js";
import { quizCheckAllCorrect } from "../controllers/user.controller.js";
import { checkUserPassedQuiz } from "../controllers/user.controller.js";
// import { checkUserVerified } from "../controllers/user.controller.js";
import { upgradeSkill } from "../controllers/user.controller.js";
import { isAlreadyMint } from "../controllers/user.controller.js";

// import { createUser } from "../controllers/user.controller";

const router = express.Router();

// router.post('/add-user', createUser);
router.get('/get-user/:address', getUser)
router.put('/update-profile/:address', updateUser)
router.get('/', test)
router.get('/get-or-create/:address', getOrCreateUser)
router.post('/fetch-questions', fetchQuestions)
router.post('/submit-quiz', quizCheckAllCorrect)
router.get('/check-user-passed', checkUserPassedQuiz)
// router.get('/check-user-verified', checkUserVerified)
router.put('/upgrade-skill', upgradeSkill)
router.post('/is-already-mint',isAlreadyMint);

export default router;
