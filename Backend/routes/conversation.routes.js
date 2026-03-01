import express from "express";
import { requireAuth } from "../middleware/authHttp.middleware.js";
import {
  createConversation,
  getConversations,
  getConversationMessages,
  markConversationSeen,
  sendMessage,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.post("/create", requireAuth, createConversation);
router.get("/get-conversations", requireAuth, getConversations);
router.get("/:conversationId/messages", requireAuth, getConversationMessages);
router.patch("/:conversationId/seen", requireAuth, markConversationSeen);
router.post("/send-message", requireAuth, sendMessage);

export default router;
