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
        
        const email = payload.email || payload.email_addresses?.[0] || `${userId}@clerk-user.local`;
        const firstName = payload.first_name || payload.given_name || '';
        const lastName = payload.last_name || payload.family_name || '';
        const name = `${firstName} ${lastName}`.trim() || email.split('@')[0];
        
        await db.exec`
          INSERT INTO users (id, email, name, password_hash, created_at, is_active, login_count, last_login)
          VALUES (
            ${userId},
            ${email},
            ${name},
            'clerk-managed',
            NOW(),
            true,
            1,
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            last_login = NOW(),
            login_count = users.login_count + 1,
            is_active = true
        `;
        
        await db.exec`
          INSERT INTO app_events (user_id, event_type)
          VALUES (${userId}, 'login')
        `;
        
        console.log('[Auth Handler] ✅ User synced to database');
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
