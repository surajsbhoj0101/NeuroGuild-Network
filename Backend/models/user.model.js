import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4, // Use UUID instead of ObjectId
    },
    role: {
        type: String,
        enum: ["Freelancer", "Client"],
        required: true,
    },
    wallets: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
}, { timestamps: true });

export default mongoose.model("Users", userSchema);
