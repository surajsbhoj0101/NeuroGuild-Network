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

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending"
    },

    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

BidSchema.virtual("JobDetails", {
  ref: "Job",
  localField: "jobId",      // value stored in Bid
  foreignField: "jobId",    // match with Job.jobId
  justOne: true
});

BidSchema.virtual("FreelancerDetails", {
  ref: "Freelancer",
  localField: "bidderAddress",
  foreignField:"walletAddress",
  justOne: true
})

BidSchema.set("toObject", { virtuals: true });
BidSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Bid", BidSchema);

