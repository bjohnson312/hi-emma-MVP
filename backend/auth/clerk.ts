import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"__session">;
}

export interface AuthData {
  userID: string;
  email: string | null;
}

async function verifyClerkToken(token: string, secretKey: string): Promise<{ sub: string }> {
  const response = await fetch(`https://api.clerk.com/v1/tokens/verify`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token verification failed: ${error}`);
  }

  const data = await response.json() as { sub: string };
  return data;
}

async function getClerkUser(userId: string, secretKey: string): Promise<{ id: string; email_addresses: Array<{ email_address: string }> }> {
  const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: {
      "Authorization": `Bearer ${secretKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user: ${error}`);
  }

  return response.json() as Promise<{ id: string; email_addresses: Array<{ email_address: string }> }>;
}

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const verifiedToken = await verifyClerkToken(token, clerkSecretKey());
      const user = await getClerkUser(verifiedToken.sub, clerkSecretKey());
      
      return {
        userID: user.id,
        email: user.email_addresses[0]?.email_address ?? null,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);

// Gateway removed - using session auth in api_v2_gateway instead
