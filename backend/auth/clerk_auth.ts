import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");

interface AuthParams {
  authorization?: Header<"Authorization">;
}

export interface AuthData {
  userID: string;
  email: string | null;
}

async function verifyClerkToken(token: string): Promise<{ sub: string; email?: string }> {
  const response = await fetch(`https://api.clerk.com/v1/sessions/verify`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${clerkSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error("Invalid token");
  }

  const data: any = await response.json();
  return {
    sub: data.user_id,
    email: data.email_address,
  };
}

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const verified = await verifyClerkToken(token);
      return {
        userID: verified.sub,
        email: verified.email ?? null,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
