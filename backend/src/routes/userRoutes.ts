import express from "express";
import { allUsers } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

router.get("/", authMiddleware, allUsers);

export default router;
