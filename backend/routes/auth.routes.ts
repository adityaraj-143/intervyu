import express from "express";
import { db } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/signup", (req, res) => {
  res.send("Signup successful");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const resp = await bcrypt.compare(password, user.passwordHash);

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.SECRET_KEY!,
    { expiresIn: "1h" },
  );

  if (resp) {
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true, // Use in production
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  res.send("Login successful");
});

router.post("/google", (req, res) => {
  // Logic to verify Google ID token goes here
  res.send("Google Auth successful");
});

// 3. Export the router so index.ts can use it
export default router;
