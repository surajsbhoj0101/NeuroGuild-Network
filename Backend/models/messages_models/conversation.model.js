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
}, { timestamps: true })

export default mongoose.model('Conversation', conversationSchema)
