import { api, APIError } from "encore.dev/api";
import type { SignupRequest, AuthResponse } from "./types";
import db from "../db";
import { randomBytes, pbkdf2Sync } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function generateToken(userId: string): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = { sub: userId, iat: Date.now() };
  
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  
  return `${headerB64}.${payloadB64}.local-signature`;
}

export const signup = api(
  { method: "POST", path: "/auth/signup", expose: true, auth: false },
  async (req: SignupRequest): Promise<AuthResponse> => {
    const existingUser = await db.queryRow<{ user_id: string }>`
      SELECT user_id FROM users WHERE email = ${req.email}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("User with this email already exists");
    }

    const userId = randomBytes(16).toString("hex");
    const hashedPassword = hashPassword(req.password);

    await db.exec`
      INSERT INTO users (user_id, email, password_hash)
      VALUES (${userId}, ${req.email}, ${hashedPassword})
    `;

    await db.exec`
      INSERT INTO user_profiles (user_id, name, email)
      VALUES (${userId}, ${req.email.split("@")[0]}, ${req.email})
    `;

    const token = generateToken(userId);

    return {
      userId,
      email: req.email,
      token
    };
  }
);
