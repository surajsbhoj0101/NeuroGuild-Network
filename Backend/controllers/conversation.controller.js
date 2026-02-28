import mongoose from "mongoose";
import Conversation from "../models/messages_models/conversation.model.js";
import Message from "../models/messages_models/message.model.js";
import User from "../models/user.model.js";

const isValidUserId = (value) =>
  typeof value === "string" && value.trim().length > 0;

const resolveParticipantUserId = async ({
  participantId,
  participantWallet,
}) => {
  if (isValidUserId(participantId)) {
    const user = await User.findById(participantId).select("_id");
    if (user?._id) return user._id.toString();
  }

  const normalizedWallet = String(participantWallet || "")
    .trim()
    .toLowerCase();
  if (normalizedWallet) {
    const user = await User.findOne({ wallets: normalizedWallet }).select(
      "_id",
    );
    if (user?._id) return user._id.toString();
  }

  return null;
};

export const createConversation = async (req, res) => {
  try {
    const currentUserId = req.userId;
    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const participantUserId = await resolveParticipantUserId({
      participantId: req.body?.participantId,
      participantWallet: req.body?.participantWallet || req.body?.walletAddress,
    });

    if (!participantUserId) {
      return res.status(400).json({
        success: false,
        message: "Valid participantId or participantWallet is required",
      });
    }

    if (participantUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create conversation with yourself",
      });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, participantUserId] },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, participantUserId],
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.userId;
    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const conversations = await Conversation.find({
      participants: currentUserId,
    })
      .sort({ lastMessageTimestamp: -1, updatedAt: -1 })
      .lean();

    console.log("Conversations are: ", conversations);

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { conversationId } = req.params;

    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversationId",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    }).select("_id");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { conversationId, content } = req.body;

    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversationId",
      });
    }

    const trimmedContent = String(content || "").trim();
    if (!trimmedContent) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    const message = await Message.create({
      conversationId,
      sender: currentUserId,
      content: trimmedContent,
    });

    conversation.lastMessage = trimmedContent;
    conversation.lastMessageTimestamp = message.timestamp || new Date();
    await conversation.save();

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};
