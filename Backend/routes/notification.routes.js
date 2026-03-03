import express from "express";
import { requireAuth } from "../middleware/authHttp.middleware.js";
import {
  createJobEventNotification,
  createNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", requireAuth, getMyNotifications);
router.post("/", requireAuth, createNotification);
router.post("/job-event", requireAuth, createJobEventNotification);
router.patch("/mark-all-read", requireAuth, markAllNotificationsRead);
router.patch("/:notificationId/read", requireAuth, markNotificationRead);

export default router;
