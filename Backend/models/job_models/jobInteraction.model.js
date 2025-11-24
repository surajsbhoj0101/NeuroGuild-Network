import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const JobInteractionSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },

  walletAddress: { type: String, required: true },   
  jobId: { type: String, required: true },    

  isSaved: { type: Boolean, default: false },
  isApplied: { type: Boolean, default: false },

  appliedAt: { type: Date, default: null },
  savedAt: { type: Date, default: null },
});

export default mongoose.model('JobInteraction', JobInteractionSchema);
