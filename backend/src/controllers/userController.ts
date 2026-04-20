import { Request, Response } from "express";
import { User } from "../models/User";
import mongoose from "mongoose";

export const allUsers = async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.search as string | undefined;
    const userId = req.query.userId as string | undefined;

    const keyword = searchTerm
      ? {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { phoneNumber: { $regex: searchTerm, $options: "i" } },
          ],
        }
      : {};

    // Merge exclude-self filter into one query
    const filter = userId
      ? { ...keyword, _id: { $ne: new mongoose.Types.ObjectId(userId) } }
      : keyword;

    const users = await User.find(filter).select("-password");
    res.send(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
