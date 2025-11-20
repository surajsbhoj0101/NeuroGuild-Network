import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const JobSchema = new mongoose.Schema({
    jobId: {
        type: String,
        default: uuidv4
    },
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
    completion: {
        type: Date,
        default: null,
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

}, { timestamps: true });


// VIRTUAL POPULATE 
JobSchema.virtual("clientDetails", {
    ref: "Client",            // 
    localField: "client",     // uuid stored in Job
    foreignField: "user",     // uuid in Client model
    justOne: true
});

JobSchema.set("toObject", { virtuals: true });
JobSchema.set("toJSON", { virtuals: true });


export default mongoose.model("Job", JobSchema);
