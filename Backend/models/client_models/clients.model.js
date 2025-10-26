import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {

        user: {
            type: String,
            ref: 'User',
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

        // --- Company Details ---

        companyDetails: {

            companyName: {
                type: String,
            },

            tagline: {
                type: String,
                maxlength: 150,
            },
            logoUrl: {
                type: String,
            },
            bio: {
                type: String,
                maxlength: 2000,
            },
            location: {
                type: String,
            },

            publicEmail: {
                type: String,
                match: [/.+\@.+\..+/, 'Please enter a valid email'],
            },
            website: {
                type: String,
            }
        },

        stats: {
            paymentVerified: {
                type: Boolean,
                default: false,
            },
            totalSpent: {
                type: Number,
                default: 0,
            },
            jobsPosted: {
                type: Number,
                default: 0,
            },

            averageRating: {
                type: Number,
                default: 0,
                min: 0,
                max: 5,
            },
            reviewsCount: {
                type: Number,
                default: 0,
            }
        },

    },
    {

        timestamps: true,
        toJSON: { virtuals: true }, // Ensure virtuals are included when sending as JSON
        toObject: { virtuals: true },
    }
);

export default mongoose.model('Client', clientSchema)