import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createAccessToken,
  createAuthTokens,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../services/token.service";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser) {
    return res.status(400).json({ error: "email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const createdUser = await db.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  const { accessToken, refreshToken } = createAuthTokens({
    userId: createdUser.id,
    email: createdUser.email,
  });

  res.cookie("accessToken", accessToken, {
    ...getAccessTokenCookieOptions(),
  });

  res.cookie("refreshToken", refreshToken, {
    ...getRefreshTokenCookieOptions(),
  });

  res.send("Signup successful");
};

export const login = async (req: Request, res: Response) => {
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

  const { accessToken, refreshToken } = createAuthTokens({
    userId: user.id,
    email: user.email,
  });

  res.cookie("accessToken", accessToken, {
    ...getAccessTokenCookieOptions(),
  });

  res.cookie("refreshToken", refreshToken, {
    ...getRefreshTokenCookieOptions(),
  });
  res.send("Login successful");
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("accessToken", getAccessTokenCookieOptions());
  res.clearCookie("refreshToken", getRefreshTokenCookieOptions());
  res.send("Logged out successfully");
};

export const refresh = (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET!);
    const { userId, email } = decoded as { userId: string; email: string };

    const newAccessToken = createAccessToken({ userId, email });

    res.cookie("accessToken", newAccessToken, {
      ...getAccessTokenCookieOptions(),
    });

    res.send("Access token refreshed");
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "idToken is required" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const { email, name } = payload;
    if (!email) {
      return res.status(400).json({ error: "Email not found in token payload" });
    }

    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: name || "Google User",
          passwordHash: "", // Dummy hash for Google users
          authProvider: "GOOGLE",
        },
      });
    }

    const { accessToken, refreshToken } = createAuthTokens({
      userId: user.id,
      email: user.email,
    });

    res.cookie("accessToken", accessToken, {
      ...getAccessTokenCookieOptions(),
    });

    res.cookie("refreshToken", refreshToken, {
      ...getRefreshTokenCookieOptions(),
    });

    res.send("Google Auth successful");
  } catch (error) {
    console.error("Google Auth error:", error);
    res.status(401).json({ error: "Google authentication failed" });
  }
};
