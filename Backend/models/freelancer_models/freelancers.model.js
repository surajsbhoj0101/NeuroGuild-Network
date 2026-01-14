import mongoose from "mongoose";
import skillTokenizable from "../../services/tokenizableSkills.js";

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
                name: {
                    type: String,
                    enum: skillTokenizable,
                    required: true
                },

                score: {
                    ai: {
                        test: {
                            type: Number,
                            min: 0,
                            max: 100
                        },
                        confidence: {
                            type: Number,
                            min: 0,
                            max: 1
                        }
                    },

                    council: {
                        test: {
                            type: Number,
                            min: 0,
                            max: 100
                        },
                        social: {
                            type: Number,
                            min: 0,
                            max: 100
                        },
                        notes: {
                            type: String
                        }
                    },

                    final: {
                        type: Number,
                        min: 0,
                        max: 200
                    }
                },

                level: {
                    type: Number,
                    default: 0,
                    max: 3
                },

                sbt: {
                    minted: {
                        type: Boolean,
                        default: false
                    },
                    sbtAddress: {
                        type: String
                    },
                    tokenId: {
                        type: String
                    },
                    mintedAt: {
                        type: Date
                    },
                    mintedBy: {
                        councilId: {
                            type: String 
                        },
                        wallet: {
                            type: String
                        }
                    }
                },

                active: {
                    type: Boolean,
                    default: true
                },

                lastEvaluatedAt: {
                    type: Date
                },

                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
        ,
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true })

export default mongoose.model('Freelancer', freelancerSchema);