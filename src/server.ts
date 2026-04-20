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

// 🔥 Create HTTP server
const server = http.createServer(app);

// 🔥 Attach Socket.IO
const io = initSocket(server);

// 🔥 Socket logic
io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.id);

  // Join room (user specific)
  socket.on("setup", (userId) => {
    socket.join(userId);
    console.log("User joined:", userId);
  });

  // Join chat room
  socket.on("join chat", (chatId) => {
    socket.join(chatId);
    console.log("Joined chat:", chatId);
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

  socket.on("disconnect", () => {
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