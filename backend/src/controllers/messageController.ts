import { Request, Response } from "express";
import { Message } from "../models/message";
import { Chat } from "../models/chat";
import { getIO } from "../sockets/socket";
import mongoose from "mongoose";

interface AuthRequest extends Request {
  userId?: string;
}

type MediaType = "image" | "video" | "link";

const isValidHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const inferMediaTypeFromUrl = (url: string): MediaType => {
  const normalized = url.toLowerCase();

  if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?|$)/.test(normalized)) {
    return "image";
  }

  if (
    /(\.mp4|\.webm|\.mov|\.m4v|\.avi)(\?|$)/.test(normalized) ||
    normalized.includes("youtube.com") ||
    normalized.includes("youtu.be") ||
    normalized.includes("vimeo.com")
  ) {
    return "video";
  }

  return "link";
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const {
    content,
    mediaUrl,
    mediaType,
    chatId: rawChatId,
  } = req.body as {
    content?: string;
    mediaUrl?: string;
    mediaType?: MediaType;
    chatId?: string | string[];
  };
  const chatId = Array.isArray(rawChatId) ? rawChatId[0] : rawChatId;
  const senderId = Array.isArray(req.userId) ? req.userId[0] : req.userId;
  const normalizedContent = String(content || "").trim();
  const normalizedMediaUrl = String(mediaUrl || "").trim();

  if (!senderId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  if (!normalizedContent && !normalizedMediaUrl) {
    return res.status(400).json({ message: "Message content or media URL is required" });
  }

  if (normalizedMediaUrl && !isValidHttpUrl(normalizedMediaUrl)) {
    return res.status(400).json({ message: "mediaUrl must be a valid http/https URL" });
  }

  if (!normalizedMediaUrl && mediaType) {
    return res.status(400).json({ message: "mediaType requires mediaUrl" });
  }

  if (mediaType && !["image", "video", "link"].includes(mediaType)) {
    return res.status(400).json({ message: "Invalid media type" });
  }

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat ID" });
  }


  try {
    const io = getIO();

    const senderObjectId = new mongoose.Types.ObjectId(String(senderId));
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $in: [senderObjectId] },
    });

    if (!chat) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    const message = await Message.create({
      sender: senderId,
      content: normalizedContent,
      mediaUrl: normalizedMediaUrl || undefined,
      mediaType: normalizedMediaUrl ? mediaType || inferMediaTypeFromUrl(normalizedMediaUrl) : undefined,
      chat: chatId,
    });

    const fullMessage = await message.populate("sender", "name phoneNumber");

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });

    // Emit only to chat participants instead of a public chat room.
    chat.users.forEach((userId) => {
      io.to(userId.toString()).emit("message received", fullMessage);
    });

    res.json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: "Message send failed" });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  const rawChatId = req.params.chatId as string | string[] | undefined;
  const chatId = Array.isArray(rawChatId) ? rawChatId[0] : rawChatId;
  const userId = Array.isArray(req.userId) ? req.userId[0] : req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat ID" });
  }

  try {
    const requesterObjectId = new mongoose.Types.ObjectId(String(userId));
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $in: [requesterObjectId] },
    });

    if (!chat) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name phoneNumber")
      .populate("chat")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const markMessagesSeen = async (req: AuthRequest, res: Response) => {
  const { chatId: rawChatId } = req.body as { chatId?: string | string[] };
  const chatId = Array.isArray(rawChatId) ? rawChatId[0] : rawChatId;
  const userId = Array.isArray(req.userId) ? req.userId[0] : req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!chatId) {
    return res.status(400).json({ message: "chatId is required" });
  }

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat ID" });
  }

  try {
    const viewerObjectId = new mongoose.Types.ObjectId(String(userId));
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $in: [viewerObjectId] },
    }).select("users");

    if (!chat) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    const unseenMessages = await Message.find({
      chat: chatId,
      sender: { $ne: viewerObjectId },
      isDeleted: { $ne: true },
      status: { $ne: "seen" },
    }).select("_id");

    if (unseenMessages.length === 0) {
      return res.json({ updatedCount: 0, messageIds: [] });
    }

    const messageIds = unseenMessages.map((message) => message._id);

    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { status: "seen" } }
    );

    const io = getIO();
    chat.users.forEach((participantId) => {
      io.to(participantId.toString()).emit("messages seen", {
        chatId,
        messageIds: messageIds.map((messageId) => messageId.toString()),
        seenBy: userId,
      });
    });

    res.json({ updatedCount: messageIds.length, messageIds });
  } catch (error) {
    res.status(500).json({ message: "Failed to update seen status" });
  }
};

export const editMessage = async (req: AuthRequest, res: Response) => {
  const rawMessageId = req.params.messageId as string | string[] | undefined;
  const messageId = Array.isArray(rawMessageId) ? rawMessageId[0] : rawMessageId;
  const userId = Array.isArray(req.userId) ? req.userId[0] : req.userId;
  const { content } = req.body as { content?: string };

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Invalid message ID" });
  }

  const normalizedContent = String(content || "").trim();
  if (!normalizedContent) {
    return res.status(400).json({ message: "content is required" });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.sender || !message.chat) {
      return res.status(400).json({ message: "Malformed message data" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Deleted messages cannot be edited" });
    }

    message.content = normalizedContent;
    await message.save();

    const fullMessage = await message.populate("sender", "name phoneNumber");

    const chat = await Chat.findById(message.chat).select("users latestMessage");
    if (chat) {
      const io = getIO();
      chat.users.forEach((participantId) => {
        io.to(participantId.toString()).emit("message updated", fullMessage);
      });
    }

    res.json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: "Failed to edit message" });
  }
};

export const deleteMessage = async (req: AuthRequest, res: Response) => {
  const rawMessageId = req.params.messageId as string | string[] | undefined;
  const messageId = Array.isArray(rawMessageId) ? rawMessageId[0] : rawMessageId;
  const userId = Array.isArray(req.userId) ? req.userId[0] : req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
    return res.status(400).json({ message: "Invalid message ID" });
  }

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.sender || !message.chat) {
      return res.status(400).json({ message: "Malformed message data" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    if (message.isDeleted) {
      const existingDeletedMessage = await message.populate("sender", "name phoneNumber");
      return res.json(existingDeletedMessage);
    }

    const chatId = message.chat.toString();
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "This message was deleted";
    message.mediaUrl = undefined;
    message.mediaType = undefined;
    await message.save();

    const fullMessage = await message.populate("sender", "name phoneNumber");

    const chat = await Chat.findById(chatId).select("users");
    if (chat) {
      const io = getIO();
      chat.users.forEach((participantId) => {
        io.to(participantId.toString()).emit("message deleted", {
          chatId,
          message: fullMessage,
        });
      });
    }

    res.json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: "Failed to delete message" });
  }
};