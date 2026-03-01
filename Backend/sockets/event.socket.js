import Conversation from "../models/messages_models/conversation.model.js";
import Message from "../models/messages_models/message.model.js";
import User from "../models/user.model.js";

const resolveParticipantUserId = async (payload) => {
  const participantId = String(payload?.participantId || "").trim();
  const participantWallet = String(payload?.walletAddress || "")
    .trim()
    .toLowerCase();

  if (participantId) {
    const userById = await User.findById(participantId).select("_id");
    if (userById?._id) return userById._id;
  }

  if (participantWallet) {
    const userByWallet = await User.findOne({
      wallets: participantWallet,
    }).select("_id");
    if (userByWallet?._id) return userByWallet._id;
  }

  return null;
};

export const registerSocketEvents = (io, socket) => {
  console.log("New client connected: " + socket.id);

  socket.on("sendMessage", async ({ receiverId, message }, callback) => {
    try {
      const senderId = socket.user.userId;
      const content = String(message || "").trim();

      if (!content) throw new Error("message required");

      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
        $expr: { $eq: [{ $size: "$participants" }, 2] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          lastMessage: content,
          lastMessageTimestamp: new Date(),
          unreadCounts: {
            [senderId]: 0,
            [receiverId]: 0,
          },
        });
      }

      const savedMessage = await Message.create({
        conversationId: conversation._id,
        sender: senderId,
        content,
        seenBy: [senderId],
        seenAt: null,
      });

      conversation.lastMessage = content;
      conversation.lastMessageTimestamp = savedMessage.createdAt;
      if (!conversation.unreadCounts || !(conversation.unreadCounts instanceof Map)) {
        conversation.unreadCounts = new Map();
      }
      const participants = conversation.participants || [];
      participants.forEach((participantId) => {
        if (participantId === senderId) {
          conversation.unreadCounts.set(participantId, 0);
        } else {
          const current = Number(conversation.unreadCounts.get(participantId) || 0);
          conversation.unreadCounts.set(participantId, current + 1);
        }
      });
      await conversation.save();

      const payload = {
        _id: savedMessage._id,
        conversationId: conversation._id,
        sender: senderId,
        content,
        timestamp: savedMessage.createdAt,
        seenBy: savedMessage.seenBy,
        seenAt: savedMessage.seenAt,
      };

      /**
       * Server saves DB
        │
        ├── callback → "success"
        │
        ├── socket.emit → update sender UI
        │
        └── io.to(receiver) → update receiver UI
       */

      io.to(receiverId.toString()).emit("receiveMessage", payload);

      socket.emit("receiveMessage", payload);

      callback?.({ ok: true, message: payload });
    } catch (err) {
      callback?.({ ok: false, message: err.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
};
