import jwt from "jsonwebtoken";

const PROVIDER_JWT_SECRET = "provider-secret-key-change-in-production";

export interface ProviderTokenPayload {
  providerId: string;
  email: string;
  role: string;
  type: "provider";
}

export function generateProviderToken(
  providerId: string,
  email: string,
  role: string
): string {
  const payload: ProviderTokenPayload = {
    providerId,
    email,
    role,
    type: "provider",
  };

  return jwt.sign(payload, PROVIDER_JWT_SECRET, { expiresIn: "7d" });
}

export function verifyProviderToken(token: string): ProviderTokenPayload {
  try {
    return jwt.verify(token, PROVIDER_JWT_SECRET) as ProviderTokenPayload;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
}
