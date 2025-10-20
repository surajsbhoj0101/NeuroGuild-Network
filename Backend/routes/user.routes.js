import express from "express";
import { getUser } from "../controllers/user.controller.js";
import { updateUser } from "../controllers/user.controller.js";
import { test } from "../controllers/user.controller.js";
import { getOrCreateUser } from "../controllers/user.controller.js";
import { fetchQuestions } from "../controllers/user.controller.js";

// import { createUser } from "../controllers/user.controller";

const router = express.Router();

// router.post('/add-user', createUser);
router.get('/get-user/:address', getUser)
router.put('/update-profile/:address', updateUser)
router.get('/',test)
router.get('/get-or-create/:address',getOrCreateUser)
router.post('/fetch-questions',fetchQuestions)
export default router;
