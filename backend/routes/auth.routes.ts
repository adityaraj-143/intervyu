import express from "express";
import { db } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(400).json({ error: "email already exists" });
  }

  const paswordHash = await bcrypt.hash(password, 10);

  const createdUser = await db.user.create({
    data: {
      email,
      passwordHash: paswordHash,
      name,
    },
  });

  const accessToken = jwt.sign(
    { userId: createdUser.id, email: createdUser.email },
    process.env.SECRET_KEY!,
    { expiresIn: "15m" },
  );

  const refreshToken = jwt.sign(
    { userId: createdUser.id, email: createdUser.email },
    process.env.REFRESH_SECRET!,
    { expiresIn: "7d" },
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

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

  if (!resp) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.SECRET_KEY!,
    { expiresIn: "15m" },
  );

  res.cookie("jwt", token, {
    httpOnly: true,
    // secure: true, // Use in production
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.send("Login successful");
});

router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET!);
    const { userId, email } = decoded as { userId: string; email: string };

    const newAccessToken = jwt.sign(
      { userId, email },
      process.env.SECRET_KEY!,
      { expiresIn: "15m" },
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.send("Access token refreshed");
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/google", (req, res) => {
  // Logic to verify Google ID token goes here
  res.send("Google Auth successful");
});

// 3. Export the router so index.ts can use it
export default router;
