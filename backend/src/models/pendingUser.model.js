import mongoose, { Schema } from "mongoose";

const pendingUserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    username: { type: String, required: true, lowercase: true, trim: true },
    roll_no: { type: String, required: true },
    phone_number: { type: String, required: true },
    password: { type: String, required: true },
    emailVerificationToken: { type: String, required: true },
    emailVerificationExpires: { type: Date, required: true },
    lastOtpSentAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Document will automatically expire when the verification period ends
pendingUserSchema.index({ emailVerificationExpires: 1 }, { expireAfterSeconds: 0 });

export const PendingUser = mongoose.model("PendingUser", pendingUserSchema);
