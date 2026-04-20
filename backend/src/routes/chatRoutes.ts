import express from "express";
import { accessChat, getAllChats, deleteChat } from "../controllers/chatController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.post("/", authMiddleware, accessChat);
router.get("/", authMiddleware, getAllChats);
router.delete("/:chatId", authMiddleware, deleteChat);

export default router;