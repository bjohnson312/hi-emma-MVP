import { api, APIError } from "encore.dev/api";
import type { LoginRequest, AuthResponse } from "./types";
import db from "../db";
import { pbkdf2Sync } from "crypto";

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

function generateToken(userId: string): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = { sub: userId, iat: Date.now() };
  
  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64");
  
  return `${headerB64}.${payloadB64}.local-signature`;
}

export const login = api(
  { method: "POST", path: "/auth/login", expose: true, auth: false },
  async (req: LoginRequest): Promise<AuthResponse> => {
    const user = await db.queryRow<{ user_id: string; password_hash: string }>`
      SELECT user_id, password_hash FROM users WHERE email = ${req.email}
    `;

    if (!user || !verifyPassword(req.password, user.password_hash)) {
      throw APIError.unauthenticated("Invalid email or password");
    }

    const token = generateToken(user.user_id);

    return {
      userId: user.user_id,
      email: req.email,
      token
    };
  }
);
