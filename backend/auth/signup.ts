import { api, APIError, Cookie } from "encore.dev/api";
import db from "../db";
import { SignupRequest, AuthResponse } from "./types";
import * as crypto from "crypto";

interface SignupResponse extends AuthResponse {
  session: Cookie<"session">;
}

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ":" + derivedKey.toString("hex"));
    });
  });
}

export const signup = api<SignupRequest, SignupResponse>(
  { expose: true, method: "POST", path: "/auth/signup" },
  async (req): Promise<SignupResponse> => {
    if (!req.email || !req.password) {
      throw APIError.invalidArgument("email and password are required");
    }

    if (req.password.length < 8) {
      throw APIError.invalidArgument("password must be at least 8 characters");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.email)) {
      throw APIError.invalidArgument("invalid email format");
    }

    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email already exists");
    }

    const passwordHash = await hashPassword(req.password);
    const userId = crypto.randomUUID();

    await db.exec`
      INSERT INTO users (id, email, password_hash)
      VALUES (${userId}, ${req.email}, ${passwordHash})
    `;

    await db.exec`
      INSERT INTO onboarding_preferences (user_id, onboarding_completed, onboarding_step)
      VALUES (${userId}, FALSE, 0)
    `;

    const sessionToken = crypto.randomBytes(32).toString("hex");

    return {
      userId,
      email: req.email,
      session: {
        value: sessionToken,
        expires: new Date(Date.now() + 3600 * 24 * 30 * 1000),
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    };
  }
);
