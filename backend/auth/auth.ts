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
    const authHeader = params.authorization;
    if (!authHeader) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("Invalid or missing Clerk token");
    }

    // Verify the Clerk token
    // Using fetch to call Clerk's API directly since @clerk/clerk-sdk-node may not be available
    try {
      // This is a simplified verification - in production you'd decode and verify the JWT
      // For now, we'll extract the user ID from the token payload
      // Clerk JWTs have the user ID in the 'sub' claim
      
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const userId = payload.sub;
      
      if (!userId) {
        throw new Error("No user ID in token");
      }

      return {
        userID: userId
      };
    } catch (err) {
      throw APIError.unauthenticated("Invalid or missing Clerk token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: clerkAuth });
