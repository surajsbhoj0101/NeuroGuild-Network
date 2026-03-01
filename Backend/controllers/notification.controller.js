import mongoose from "mongoose";
import Notification from "../models/notifications_models/notification.model.js";
import { getSocketIO } from "../sockets/io.socket.js";

const isValidUserId = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const getMyNotifications = async (req, res) => {
  try {
    const currentUserId = req.userId;
    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const limitRaw = Number(req.query.limit || 30);
    const limit = Math.max(1, Math.min(100, Number.isNaN(limitRaw) ? 30 : limitRaw));

    const notifications = await Notification.find({ recipient: currentUserId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: currentUserId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

export const createNotification = async (req, res) => {
  try {
    const currentUserId = req.userId;
    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const recipient = String(req.body?.recipientId || currentUserId).trim();
    if (!isValidUserId(recipient)) {
      return res.status(400).json({
        success: false,
        message: "recipientId is required",
      });
    }

    // Prevent regular users from creating notifications for another user directly.
    if (recipient !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: "Cannot create notification for another user",
      });
    }

    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const link = String(req.body?.link || "").trim();
    const type = String(req.body?.type || "platform").trim();
    const metadata =
      req.body?.metadata && typeof req.body.metadata === "object"
        ? req.body.metadata
        : {};

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "title is required",
      });
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      description,
      link,
      metadata,
      createdBy: currentUserId,
    });

    // Push realtime notification to recipient room.
    const io = getSocketIO();
    if (io) {
      io.to(recipient).emit("notificationCreated", notification.toObject());
    }

    return res.status(201).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { notificationId } = req.params;

    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notificationId",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: currentUserId,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
      { new: true },
    ).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification read",
      error: error.message,
    });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const currentUserId = req.userId;
    if (!isValidUserId(currentUserId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await Notification.updateMany(
      {
        recipient: currentUserId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      },
    );

    return res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount || 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to mark notifications read",
      error: error.message,
    });
  }
};
