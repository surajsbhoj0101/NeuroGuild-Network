import express from "express";
import { requireAuth } from "../middleware/authHttp.middleware.js";
// import { createConversation, getConversations } from "../controllers/conversation.controller.js";
import { getConversations } from "../controllers/conversation.controller.js";
const router = express.Router();

router.get("/get-conversations", requireAuth, getConversations);

// // Create a new conversation
// router.post("/createConversation", createConversation);

// // Get conversations for a user
// router.get("/:userId", getConversations);

export default router;
