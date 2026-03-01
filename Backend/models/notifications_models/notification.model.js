import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      ref: "Users",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["system", "job", "governance", "security", "payment", "platform"],
      default: "platform",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    link: {
      type: String,
      default: "",
      trim: true,
      maxlength: 400,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      ref: "Users",
      default: null,
    },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
