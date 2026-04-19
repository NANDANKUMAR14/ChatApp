import { Request, Response } from "express";
import { Message } from "../models/message";
import { Chat } from "../models/chat";

export const sendMessage = async (req: Request, res: Response) => {
  const { content, chatId, senderId } = req.body;

  try {
    const message = await Message.create({
      sender: senderId,
      content,
      chat: chatId,
    });

    const populatedMessage = await message.populate("sender", "name email");

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: "Message send failed" });
  }
};