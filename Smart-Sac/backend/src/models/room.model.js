import mongoose, { Schema } from "mongoose";

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    capacity: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["available", "occupied", "reserved", "maintenance"],
        default: "available"
    },
    currentActivity: {
        type: String,
        trim: true
    },
    timeSlot: {
        type: String,
        trim: true
    },
    // --- ADD THIS FIELD ---
    bookedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
    // ----------------------
}, { timestamps: true });

export const Room = mongoose.model("Room", roomSchema);