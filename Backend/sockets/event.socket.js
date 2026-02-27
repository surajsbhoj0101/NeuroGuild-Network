import Conversation from "../models/messages_models/conversation.model.js";
import Message from "../models/messages_models/message.model.js";
import User from "../models/user.model.js";

const resolveParticipantUserId = async (payload) => {
  const participantId = String(payload?.participantId || "").trim();
  const participantWallet = String(payload?.walletAddress || "").trim().toLowerCase();

  if (participantId) {
    const userById = await User.findById(participantId).select("_id");
    if (userById?._id) return userById._id;
  }

  if (participantWallet) {
    const userByWallet = await User.findOne({ wallets: participantWallet }).select("_id");
    if (userByWallet?._id) return userByWallet._id;
  }

  return null;
};

export const registerSocketEvents = (io, socket) => {
  console.log("New client connected: " + socket.id);

  socket.on("create_room", async (participant, callback) => {
    try {
      const currentUserId = socket.user?.userId;
      if (!currentUserId) {
        throw new Error("Unauthorized");
      }

      const participantUserId = await resolveParticipantUserId(participant);
      if (!participantUserId) {
        throw new Error("Valid participantId or walletAddress is required");
      }
      if (participantUserId === currentUserId) {
        throw new Error("Cannot create room with yourself");
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

      const roomId = conversation._id.toString();
      socket.join(roomId);
      io.to(roomId).emit("room_created", { roomId, conversation });
      callback?.({ ok: true, roomId, conversation });
    } catch (error) {
      callback?.({ ok: false, message: error.message });
    }
  });

  socket.on("join_room", async ({ roomId }, callback) => {
    try {
      const currentUserId = socket.user?.userId;
      if (!roomId) throw new Error("roomId is required");

      const conversation = await Conversation.findOne({
        _id: roomId,
        participants: currentUserId,
      });

      if (!conversation) {
        throw new Error("Conversation not found or access denied");
      }

      socket.join(roomId);
      callback?.({ ok: true });
    } catch (error) {
      callback?.({ ok: false, message: error.message });
    }
  });

  socket.on("sendMessage", async ({ roomId, message }, callback) => {
    try {
      const currentUserId = socket.user?.userId;
      const content = String(message || "").trim();

      if (!roomId) throw new Error("roomId is required");
      if (!content) throw new Error("message is required");

      const conversation = await Conversation.findOne({
        _id: roomId,
        participants: currentUserId,
      });

      if (!conversation) {
        throw new Error("Conversation not found or access denied");
      }

      const savedMessage = await Message.create({
        conversationId: roomId,
        sender: currentUserId,
        content,
      });

      conversation.lastMessage = content;
      conversation.lastMessageTimestamp = savedMessage.timestamp || new Date();
      await conversation.save();

      const payload = {
        _id: savedMessage._id,
        conversationId: savedMessage.conversationId,
        sender: savedMessage.sender,
        content: savedMessage.content,
        timestamp: savedMessage.timestamp,
        createdAt: savedMessage.createdAt,
      };

      io.to(roomId).emit("receiveMessage", payload);
      callback?.({ ok: true, message: payload });
    } catch (error) {
      callback?.({ ok: false, message: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });
};
