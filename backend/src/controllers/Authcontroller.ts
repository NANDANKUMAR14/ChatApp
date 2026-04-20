import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Generate JWT
const generateToken = (id: string) => {
  const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "").trim();
const isValidPhoneNumber = (value: string) => /^\d{10}$/.test(value);

// SIGNUP
export const signup = async (req: Request, res: Response) => {
  const { name, phoneNumber, password } = req.body;
  try {
    const normalizedPhoneNumber = normalizePhoneNumber(String(phoneNumber || ""));

    if (!isValidPhoneNumber(normalizedPhoneNumber)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    const existingUser = await User.findOne({ phoneNumber: normalizedPhoneNumber });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phoneNumber: normalizedPhoneNumber,
      password: hashedPassword,
    });

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
      },
      token: generateToken(user._id.toString()),
    });
  } catch (error) {
    console.error("🔥 SIGNUP ERROR FULL:", error);
    res.status(500).json({ message: "Signup failed" });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
const { phoneNumber, password } = req.body;
try {
  const normalizedPhoneNumber = normalizePhoneNumber(String(phoneNumber || ""));

  if (!isValidPhoneNumber(normalizedPhoneNumber)) {
    return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
  }

  const user = await User.findOne({ phoneNumber: normalizedPhoneNumber });

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  } else {
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
      },
      token: generateToken(user._id.toString()),
    });
  }
  }
   catch (error: any) {
  console.error("🔥 LOGIN ERROR FULL:", error);
  console.error("🔥 MESSAGE:", error.message);
  res.status(500).json({ message: error.message || "Login failed" });
}

};