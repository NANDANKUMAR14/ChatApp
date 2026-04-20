import express from "express";
import { sendMessage, getMessages, markMessagesSeen, editMessage, deleteMessage } from "../controllers/messageController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/", authMiddleware, sendMessage);
router.patch("/seen", authMiddleware, markMessagesSeen);
router.patch("/:messageId", authMiddleware, editMessage);
router.delete("/:messageId", authMiddleware, deleteMessage);
router.get("/:chatId", authMiddleware, getMessages);

export default router;