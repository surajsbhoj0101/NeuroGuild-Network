import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema(
    {

        userId: {
            type: String,
            default: uuidv4,
            unique: true,
        },


        walletAddress: {
            type: String,
            unique: true,
            sparse: true, // allows multiple nulls
        },

        BasicInformation: {
            name: { type: String, required: true },
            title: { type: String },
            bio: { type: String },
            location: { type: String },
            email: { type: String }
        },

        ProfessionalDetails: {
            hourlyRate: { type: String },
            experience: { type: String }, // fixed typo
            availability: {
                type: String,
                enum: ["available", "busy", "unavailable"],
                default: "available",
            },
        },


        SocialLinks: {
            github: { type: String },
            twitter: { type: String },
            linkedIn: { type: String },
            website: { type: String },
        },


        role: {
            type: String,
            enum: ["freelancer", "client"],
            default: "freelancer",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
