import jwt from "jsonwebtoken";

type AuthPayload = {
  userId: string;
  email: string;
};

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 15 * 60 * 1000,
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createAuthTokens(payload: AuthPayload) {
  return {
    accessToken: jwt.sign(payload, process.env.SECRET_KEY!, {
      expiresIn: "15m",
    }),
    refreshToken: jwt.sign(payload, process.env.REFRESH_SECRET!, {
      expiresIn: "7d",
    }),
  };
}

export function createAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, process.env.SECRET_KEY!, {
    expiresIn: "15m",
  });
}

export function getRefreshTokenCookieOptions() {
  return refreshTokenCookieOptions;
}

export function getAccessTokenCookieOptions() {
  return accessTokenCookieOptions;
}
