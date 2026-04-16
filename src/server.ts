import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/AuthRoute";

const app = express();
dotenv.config({ path: "./src/.env" });
connectDB();


// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});