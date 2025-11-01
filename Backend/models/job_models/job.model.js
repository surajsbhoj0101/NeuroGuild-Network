import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    skills: {
        type: [String],
        required: true,
    },
    experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "expert", "not-specified"],
        default: "not-specified",
    },
    budgetType: {
        type: String,
        enum: ["fixed", "hourly"],
        default: "fixed"
    },
    budget: {
        type: Number,
        required: true,
        min: 0,
    },
    deadline: {
        type: Date,
        default: null,
    },


    clientAddress: {
        type: String,
        required: true,
        index: true,
    },
    client: {
        type: String,
        ref: 'Users',
        required: true,
    },

    status: {
        type: String,
        enum: ["open", "in-progress", "completed", "cancelled"],
        default: "open",
    },

    proposalsCount: {
        type: Number,
        default: 0
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

export default mongoose.model("Job", JobSchema);
