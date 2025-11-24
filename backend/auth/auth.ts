import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

interface AuthParams {
  authorization: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
}

export const clerkAuth = authHandler<AuthParams, AuthData>(
  async (params) => {
    console.log('[Auth Handler] 🔍 Auth handler called');
    
    const authHeader = params.authorization;
    if (!authHeader) {
      console.log('[Auth Handler] ❌ No authorization header found');
      throw APIError.unauthenticated("Missing authorization header");
    }

    console.log('[Auth Handler] ✅ Authorization header present');

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      console.log('[Auth Handler] ❌ No token after stripping Bearer prefix');
      throw APIError.unauthenticated("Invalid or missing Clerk token");
    }

    console.log('[Auth Handler] 🎫 Token extracted');

    try {
      const parts = token.split('.');
      console.log('[Auth Handler] 📦 Token has', parts.length, 'parts');
      
      if (parts.length !== 3) {
        console.log('[Auth Handler] ❌ Invalid JWT format - expected 3 parts, got', parts.length);
        throw new Error("Invalid JWT format");
      }
      
      console.log('[Auth Handler] 🔓 Decoding payload...');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('[Auth Handler] 📄 Payload decoded:', payload);
      
      const userId = payload.sub;
      
      if (!userId) {
        console.log('[Auth Handler] ❌ No user ID (sub) in token payload');
        throw new Error("No user ID in token");
      }

      console.log('[Auth Handler] ✅ User ID extracted from token:', userId);
      console.log('[Auth Handler] 🎉 Authentication successful!');

      try {
        const db = (await import("../db")).default;
        await db.exec`
          INSERT INTO app_events (user_id, event_type)
          VALUES (${userId}::uuid, 'login')
        `;
        await db.exec`
          UPDATE users 
          SET last_login_at = NOW(), total_logins = COALESCE(total_logins, 0) + 1
          WHERE id = ${userId}::uuid
        `;
      } catch (err) {
        console.log('[Auth Handler] ⚠️ Failed to log event:', err);
      }

      return {
        userID: userId
      };
    } catch (err) {
      console.log('[Auth Handler] 💥 Error during token verification:', err);
      throw APIError.unauthenticated("Invalid or missing Clerk token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: clerkAuth });
