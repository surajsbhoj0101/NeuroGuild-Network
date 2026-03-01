import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    sender: {
        type: String,
        ref: 'Users',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    seenBy: {
        type: [String],
        default: [],
    },
    seenAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true })

export default mongoose.model('Message', messageSchema)
