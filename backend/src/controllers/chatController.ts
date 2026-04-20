import { Request, Response } from 'express';
import { Chat } from "../models/chat";
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  userId?: string;
}

export const accessChat = async (req: AuthRequest, res: Response) => {
  const { userId: targetUserId } = req.body as { userId: string };
  const myId = req.userId;

  if (!targetUserId || !myId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const myObjectId = new mongoose.Types.ObjectId(myId);
    const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

    let chat = await Chat.findOne({
      isGroupChat: false,
      users: { $all: [myObjectId, targetObjectId] },
    }).populate("users", "-password");

    if (chat) {
      return res.json(chat);
    }

    const newChat = await Chat.create({
      chatName: "sender",
      isGroupChat: false,
      users: [myObjectId, targetObjectId],
    });

    const fullChat = await Chat.findById(newChat._id).populate("users", "-password");
    res.status(201).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: "Chat creation failed" });
  }
};

export const getAllChats = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  try {
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const objectId = new mongoose.Types.ObjectId(userId);
    const chats = await Chat.find({
      users: { $in: [objectId] },
    })
      .populate("users", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender",
          select: "_id name phoneNumber",
        },
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};

export const deleteChat = async (req: AuthRequest, res: Response) => {
  const { chatId } = req.params as { chatId: string };
  const rawId = req.userId;

  if (!rawId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Re-assign with explicit type so TypeScript knows this is definitely a string
  const myId: string = rawId;

  try {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Use ObjectId.equals() for proper Mongoose type-safe comparison
    const myObjectId = new mongoose.Types.ObjectId(myId);
    const isMember = chat.users.some((uid) =>
      (uid as mongoose.Types.ObjectId).equals(myObjectId)
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not authorized to delete this chat" });
    }

    await Chat.findByIdAndDelete(chatId);
    res.json({ message: "Chat deleted successfully", chatId });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete chat" });
  }
};

