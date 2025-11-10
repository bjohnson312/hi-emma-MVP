import { api, APIError, Cookie } from "encore.dev/api";
import db from "../db";
import { LoginRequest, AuthResponse } from "./types";
import * as crypto from "crypto";

interface LoginResponse extends AuthResponse {
  session: Cookie<"session">;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(":");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req): Promise<LoginResponse> => {
    if (!req.email || !req.password) {
      throw APIError.invalidArgument("email and password are required");
    }

    const user = await db.queryRow<{ id: string; email: string; password_hash: string }>`
      SELECT id, email, password_hash FROM users WHERE email = ${req.email}
    `;

    if (!user) {
      throw APIError.unauthenticated("invalid email or password");
    }

    const isValid = await verifyPassword(req.password, user.password_hash);
    if (!isValid) {
      throw APIError.unauthenticated("invalid email or password");
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");

    return {
      userId: user.id,
      email: user.email,
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
