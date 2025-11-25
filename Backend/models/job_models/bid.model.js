import mongoose from "mongoose";

const BidSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      index: true,
    },

    bidderAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true
    },

    bidAmount: {
      type: Number,
      required: true
    },

    proposal: {
      type: String,
      default: ""
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model("Bid", BidSchema);
