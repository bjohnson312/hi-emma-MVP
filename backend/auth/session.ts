import { Cookie, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import db from "../db";

interface AuthParams {
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string | null;
}

// Simple session auth handler that validates the session cookie
// The session cookie value is the user ID (set by /auth/login)
export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const sessionToken = data.session?.value;
    if (!sessionToken) {
      throw APIError.unauthenticated("missing session cookie");
    }

    try {
      // The session token is currently just the user ID
      // In a production app, you'd want proper session management with a sessions table
      const user = await db.queryRow<{ id: string; email: string }>`
        SELECT id, email FROM users WHERE id = ${sessionToken}
      `;

      if (!user) {
        throw APIError.unauthenticated("invalid session");
      }

      return {
        userID: user.id,
        email: user.email,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid session", err as Error);
    }
  }
);
