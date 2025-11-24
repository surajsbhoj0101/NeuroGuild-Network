import mongoose from "mongoose";

const freelancerSchema = new mongoose.Schema(
    {

        user: {
            type: String,
            ref: 'Users',
            required: true,
            unique: true,
            index: true,
        },

        walletAddress: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        BasicInformation: {
            name: { type: String, default: "New User" },
            title: { type: String },
            bio: { type: String },
            location: { type: String },
            email: {
                type: String,
                match: [/.+\@.+\..+/, 'Please enter a valid email'],
            }
            ,
            avatarUrl: {
                type: String
            }
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


        skills: [
            {
                name: { type: String },
                sbtAddress: { type: String },
                minted: { type: Boolean, default: false },
                active: { type: Boolean, default: true },
                tokenId: { type: String },
                quizPassed: { type: Boolean, default: false }                   // Optional if you track on-chain tokenId
            }
        ],
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true })

export default mongoose.model('Freelancer', freelancerSchema);