import Conversation from "../models/messages_models/conversation.model.js";
import Message from "../models/messages_models/message.model.js";
import User from "../models/user.model.js";

export const registerSocketEvents = (io, socket) => {
  console.log("New client connected: " + socket.id);

  // Prevent pending users from sending messages
  socket.on("sendMessage", async ({ receiverId, message }, callback) => {
    try {
      // Block pending users from sending messages
      if (socket.isPending || !socket.user?.userId) {
        const error = "You must complete registration before messaging";
        console.warn(`Pending user ${socket.id} attempted to send message`);
        callback?.({ ok: false, message: error });
        return;
      }

      const senderId = socket.user.userId;
      const content = String(message || "").trim();

      if (!content) {
        callback?.({ ok: false, message: "Message content cannot be empty" });
        return;
      }

      if (!receiverId) {
        callback?.({ ok: false, message: "Receiver ID is required" });
        return;
      }

      // Validate receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        callback?.({ ok: false, message: "Recipient not found" });
        return;
      }

      // Prevent self-messaging
      if (senderId.toString() === receiverId.toString()) {
        callback?.({ ok: false, message: "Cannot message yourself" });
        return;
      }

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
            [receiverId]: 1,
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
        if (participantId.toString() === senderId.toString()) {
          conversation.unreadCounts.set(participantId.toString(), 0);
        } else {
          const current = Number(conversation.unreadCounts.get(participantId.toString()) || 0);
          conversation.unreadCounts.set(participantId.toString(), current + 1);
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
       * Message delivery flow:
        │
        ├── callback → acknowledge to sender
        │
        ├── socket.emit → update sender UI
        │
        └── io.to(receiver) → deliver to receiver's room
       */

      // Send acknowledgment to sender
      callback?.({ ok: true, message: payload });

      // Update sender UI
      socket.emit("receiveMessage", payload);

      // Deliver to receiver's personal room
      io.to(receiverId.toString()).emit("receiveMessage", payload);

      console.log(`Message sent from ${senderId} to ${receiverId}`);
    } catch (err) {
      console.error("Send message error:", err);
      callback?.({ ok: false, message: err.message || "Failed to send message" });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected: " + socket.id);
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
};
