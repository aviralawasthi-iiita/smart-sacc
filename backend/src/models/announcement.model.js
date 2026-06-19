import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    heading: { type: String, required: true },
    content: { type: String, required: true },
    footer: { type: String, default: "" },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
