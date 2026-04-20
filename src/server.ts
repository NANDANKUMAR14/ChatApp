import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/AuthRoute";
import chatRoutes from "./routes/chatRoutes";
import messageRoutes from "./routes/messageRoutes";
import http from "http";
import { initSocket } from "./sockets/socket";



dotenv.config({ path: "./src/.env" });
const app = express();
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

//routes

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages",messageRoutes);
const onlineUsers = new Map<string, string>();


// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔥 Attach Socket.IO
const io = initSocket(server);

// 🔥 Socket logic
io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // Setup user and track online status
  socket.on("setup", (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    io.emit("online users", Array.from(onlineUsers.keys()));
    console.log("User setup:", userId, "Online users:", Array.from(onlineUsers.keys()));
  });

  // Join chat room
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    console.log("Joined chat:", chatId);
  });   
  
  // Typing indicator
  socket.on("typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("typing", { userId });
  });

  socket.on("stop typing", ({ chatId, userId }) => {
    socket.to(chatId).emit("stop typing", { userId });
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
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
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