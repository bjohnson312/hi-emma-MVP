import { Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { verifyToken } from "./session";

interface AuthParams {
  authorization: Header<"Authorization">;
  "x-dev-userid"?: Header<"X-Dev-UserId">;
}

export interface AuthData {
  userID: string;
}

export const localAuth = authHandler<AuthParams, AuthData>(
  async (params) => {
    if (process.env.NODE_ENV === "development" && params["x-dev-userid"]) {
      console.log("[Auth] Using dev mode user ID:", params["x-dev-userid"]);
      return { userID: params["x-dev-userid"] };
    }

    const authHeader = params.authorization;
    if (!authHeader) {
      throw APIError.unauthenticated("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("Invalid token format");
    }

    const userId = verifyToken(token);
    if (!userId) {
      throw APIError.unauthenticated("Invalid or expired token");
    }

    return { userID: userId };
  }
);

export const gw = new Gateway({ authHandler: localAuth });
