import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

interface AuthParams {
  authorization: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
}

export const clerkAuth = authHandler<AuthParams, AuthData>(
  async (params, meta) => {
    console.log('[Auth Handler] 🔍 Auth handler called');
    console.log('[Auth Handler] ==================== FULL REQUEST DETAILS ====================');
    console.log('[Auth Handler] 📦 Raw params object:', JSON.stringify(params, null, 2));
    console.log('[Auth Handler] 🌐 Request metadata:', JSON.stringify(meta, null, 2));
    console.log('[Auth Handler] 📋 All headers available in params:', Object.keys(params));
    
    const authHeader = params.authorization;
    console.log('[Auth Handler] 🔑 Authorization header value:', authHeader);
    console.log('[Auth Handler] 🔑 Authorization header type:', typeof authHeader);
    console.log('[Auth Handler] 🔑 Authorization header exists?', !!authHeader);
    
    if (!authHeader) {
      console.log('[Auth Handler] ❌ No authorization header found');
      console.log('[Auth Handler] ❌ params.authorization is:', authHeader);
      throw APIError.unauthenticated("Missing authorization header");
    }

    console.log('[Auth Handler] ✅ Authorization header present (full):', authHeader);
    console.log('[Auth Handler] ✅ Authorization header (first 50 chars):', authHeader.substring(0, 50) + '...');

    const token = authHeader.replace("Bearer ", "");
    console.log('[Auth Handler] 🎫 Token after removing Bearer prefix:', token.substring(0, 50) + '...');
    console.log('[Auth Handler] 🎫 Token length:', token.length);
    
    if (!token) {
      console.log('[Auth Handler] ❌ No token after stripping Bearer prefix');
      throw APIError.unauthenticated("Invalid or missing Clerk token");
    }

    console.log('[Auth Handler] 🎫 Token extracted (first 50 chars):', token.substring(0, 50) + '...');

    try {
      const parts = token.split('.');
      console.log('[Auth Handler] 📦 Token has', parts.length, 'parts');
      console.log('[Auth Handler] 📦 Part 0 (header) length:', parts[0]?.length);
      console.log('[Auth Handler] 📦 Part 1 (payload) length:', parts[1]?.length);
      console.log('[Auth Handler] 📦 Part 2 (signature) length:', parts[2]?.length);
      
      if (parts.length !== 3) {
        console.log('[Auth Handler] ❌ Invalid JWT format - expected 3 parts, got', parts.length);
        throw new Error("Invalid JWT format");
      }
      
      console.log('[Auth Handler] 🔓 Decoding header...');
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      console.log('[Auth Handler] 📄 Header decoded:', JSON.stringify(header, null, 2));
      
      console.log('[Auth Handler] 🔓 Decoding payload...');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('[Auth Handler] 📄 Payload decoded (full):', JSON.stringify(payload, null, 2));
      
      const userId = payload.sub;
      console.log('[Auth Handler] 👤 User ID from payload.sub:', userId);
      
      if (!userId) {
        console.log('[Auth Handler] ❌ No user ID (sub) in token payload');
        console.log('[Auth Handler] ❌ Payload keys available:', Object.keys(payload));
        throw new Error("No user ID in token");
      }

      console.log('[Auth Handler] ✅ User ID extracted from token:', userId);
      console.log('[Auth Handler] 🎉 Authentication successful! Returning AuthData:', { userID: userId });

      return {
        userID: userId
      };
    } catch (err) {
      console.log('[Auth Handler] 💥 Error during token verification');
      console.log('[Auth Handler] 💥 Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.log('[Auth Handler] 💥 Error message:', err instanceof Error ? err.message : String(err));
      console.log('[Auth Handler] 💥 Error stack:', err instanceof Error ? err.stack : 'N/A');
      throw APIError.unauthenticated("Invalid or missing Clerk token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: clerkAuth });
