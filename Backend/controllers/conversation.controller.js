import mongoose from "mongoose";
import Conversation from "../models/messages_models/conversation.model.js";
import Message from "../models/messages_models/message.model.js";
import User from "../models/user.model.js";
import Freelancer from "../models/freelancer_models/freelancers.model.js";
import Client from "../models/client_models/clients.model.js";

const isValidUserId = (value) =>
  typeof value === "string" && value.trim().length > 0;

const getUnreadMapObject = (unreadCounts) => {
  if (!unreadCounts) return {};
  if (unreadCounts instanceof Map) return Object.fromEntries(unreadCounts.entries());
  if (typeof unreadCounts === "object") return unreadCounts;
  return {};
};

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

const hydrateConversations = async (conversations, currentUserId) => {
  const participantIds = conversations
    .map((conversation) =>
      conversation.participants.find((participant) => participant !== currentUserId),
    )
    .filter(Boolean);

  const uniqueParticipantIds = [...new Set(participantIds)];

  const users = await User.find({ _id: { $in: uniqueParticipantIds } })
    .select("_id wallets role")
    .lean();

  const userMap = new Map(users.map((user) => [user._id, user]));
  const freelancerProfiles = await Freelancer.find({
    user: { $in: uniqueParticipantIds },
  })
    .select("user BasicInformation.avatarUrl BasicInformation.name")
    .lean();
  const clientProfiles = await Client.find({
    user: { $in: uniqueParticipantIds },
  })
    .select("user companyDetails.logoUrl companyDetails.companyName")
    .lean();
  const freelancerProfileMap = new Map(
    freelancerProfiles.map((profile) => [
      profile.user,
      {
        profileUrl: profile.BasicInformation?.avatarUrl || "",
        displayName: profile.BasicInformation?.name || "",
      },
    ]),
  );
  const clientProfileMap = new Map(
    clientProfiles.map((profile) => [
      profile.user,
      {
        profileUrl: profile.companyDetails?.logoUrl || "",
        displayName: profile.companyDetails?.companyName || "",
      },
    ]),
  );

  return conversations.map((conversation) => {
    const participantId =
      conversation.participants.find((participant) => participant !== currentUserId) ||
      null;

    const role = userMap.get(participantId)?.role || "user";
    const roleProfile =
      role === "freelancer"
        ? freelancerProfileMap.get(participantId)
        : clientProfileMap.get(participantId);

    return {
      ...conversation,
      unread: getUnreadMapObject(conversation.unreadCounts)[currentUserId] || 0,
      participant: participantId
        ? {
            _id: participantId,
            wallets: userMap.get(participantId)?.wallets || "",
            role,
            profileUrl: roleProfile?.profileUrl || "",
            displayName: roleProfile?.displayName || "",
          }
        : null,
    };
  });
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
    }).lean();

    if (!conversation) {
      const created = await Conversation.create({
        participants: [currentUserId, participantUserId],
        unreadCounts: {
          [currentUserId]: 0,
          [participantUserId]: 0,
        },
      });
      conversation = created.toObject();
    }

    const [hydratedConversation] = await hydrateConversations(
      [conversation],
      currentUserId,
    );

    return res.status(200).json({
      success: true,
      conversation: hydratedConversation,
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

    const hydratedConversations = await hydrateConversations(
      conversations,
      currentUserId,
    );

    return res.status(200).json({
      success: true,
      conversations: hydratedConversations,
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

    // Opening a conversation marks all incoming messages as seen for this user.
    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: currentUserId },
        seenBy: { $ne: currentUserId },
      },
      {
        $addToSet: { seenBy: currentUserId },
        $set: { seenAt: new Date() },
      },
    );

    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCounts.${currentUserId}`]: 0 } },
    );

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
      seenBy: [currentUserId],
      seenAt: null,
    });

    conversation.lastMessage = trimmedContent;
    conversation.lastMessageTimestamp = message.timestamp || new Date();
    if (!conversation.unreadCounts || !(conversation.unreadCounts instanceof Map)) {
      conversation.unreadCounts = new Map();
    }
    const participants = conversation.participants || [];
    participants.forEach((participantId) => {
      if (participantId === currentUserId) {
        conversation.unreadCounts.set(participantId, 0);
      } else {
        const current = Number(conversation.unreadCounts.get(participantId) || 0);
        conversation.unreadCounts.set(participantId, current + 1);
      }
    });
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

export const markConversationSeen = async (req, res) => {
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

    await Message.updateMany(
      {
        conversationId,
        sender: { $ne: currentUserId },
        seenBy: { $ne: currentUserId },
      },
      {
        $addToSet: { seenBy: currentUserId },
        $set: { seenAt: new Date() },
      },
    );

    await Conversation.updateOne(
      { _id: conversationId },
      { $set: { [`unreadCounts.${currentUserId}`]: 0 } },
    );

    return res.status(200).json({
      success: true,
      message: "Conversation marked as seen",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark conversation as seen",
      error: error.message,
    });
  }
};
