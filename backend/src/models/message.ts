import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
      default: "",
    },
    mediaUrl: {
      type: String,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "link"],
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
      
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);