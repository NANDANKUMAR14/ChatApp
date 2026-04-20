import { Request, Response } from "express";
import { Message } from "../models/message";
import { Chat } from "../models/chat";
import { getIO } from "../sockets/socket";

export const sendMessage = async (req: Request, res: Response) => {
  const { content, chatId, senderId } = req.body;


  try {
    const io = getIO();

    const message = await Message.create({
      sender: senderId,
      content,
      chat: chatId,
    });

    const fullMessage = await message.populate("sender", "name email");

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message._id,
    });
      // 🔥 Emit to socket
    io.to(chatId).emit("message received", fullMessage);

    res.json(fullMessage);
  } catch (error) {
    res.status(500).json({ message: "Message send failed" });
  }
};