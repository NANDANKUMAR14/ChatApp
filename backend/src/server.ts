import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/AuthRoute";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import http from "http";
import { initSocket } from "./sockets/socket";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Chat } from "./models/chat";



dotenv.config();
const app = express();
connectDB();

const getAllowedOrigins = () => {
  const raw = process.env.CLIENT_URL || "";
  const origins = raw
    .split(",")
    .map((origin) => origin.trim())
    .map((origin) => origin.replace(/\/+$/, ""))
    .filter(Boolean);

  // Allow localhost during development when CLIENT_URL is not set.
  if (origins.length === 0 && process.env.NODE_ENV !== "production") {
    return ["http://localhost:5173"];
  }

  return origins;
};

const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

//routes

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages",messageRoutes);
app.use("/api/users", userRoutes);
const onlineUsers = new Map<string, string>();


// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔥 Attach Socket.IO
const io = initSocket(server, allowedOrigins);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication failed"));
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return next(new Error("Server misconfigured"));
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string };

    if (!decoded?.id) {
      return next(new Error("Authentication failed"));
    }

    socket.data.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// 🔥 Socket logic
io.on("connection", (socket) => {
  const currentUserId = socket.data.userId as string | undefined;

  if (!currentUserId) {
    socket.disconnect();
    return;
  }

  console.log("🔥 User connected:", socket.id);

  // Track online status for authenticated user
  socket.join(currentUserId);
  onlineUsers.set(currentUserId, socket.id);
  io.emit("online users", Array.from(onlineUsers.keys()));
  console.log("User setup:", currentUserId, "Online users:", Array.from(onlineUsers.keys()));

  // Join chat room
  socket.on("join chat", async (chatId: string) => {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return;
    }

    const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
    const chat = await Chat.findOne({
      _id: chatId,
      users: { $in: [currentUserObjectId] },
    }).select("_id");

    if (!chat) {
      return;
    }

    socket.join(chatId);
    console.log("Joined chat:", chatId);
  });   
  
  // Typing indicator
  socket.on("typing", ({ chatId }: { chatId: string }) => {
    if (!socket.rooms.has(chatId)) {
      return;
    }

    socket.to(chatId).emit("typing", { userId: currentUserId });
  });

  socket.on("stop typing", ({ chatId }: { chatId: string }) => {
    if (!socket.rooms.has(chatId)) {
      return;
    }

    socket.to(chatId).emit("stop typing", { userId: currentUserId });
  });

  // Send message
  socket.on("new message", (message) => {
    const chat = message.chat;

    if (!chat.users) return;

    chat.users.forEach((user: any) => {
      if (user._id === message.sender._id) return;

      socket.to(user._id).emit("message received", message);
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    onlineUsers.delete(currentUserId);
    io.emit("online users", Array.from(onlineUsers.keys()));
    console.log("❌ User disconnected");
  });
});



// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});