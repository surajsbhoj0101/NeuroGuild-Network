import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema({
    participants: [
        {
            type: String,
            ref: 'Users',
            required: true,
        }
    ],
    lastMessage: {
        type: String,
        default: "",
    },
    lastMessageTimestamp: {
        type: Date,
        default: Date.now,
    },
    unreadCounts: {
        // key: userId, value: unread count for that user in this conversation
        type: Map,
        of: Number,
        default: {},
    },
}, { timestamps: true })

export default mongoose.model('Conversation', conversationSchema)
