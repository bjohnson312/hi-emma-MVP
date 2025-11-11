import { api } from "encore.dev/api";
import type { AdminLoginRequest, AdminLoginResponse } from "./types";
import { randomUUID } from "crypto";

export const login = api(
  { method: "POST", path: "/admin/auth/login", expose: true, auth: false },
  async (req: AdminLoginRequest): Promise<AdminLoginResponse> => {
    if (req.username === "Admin" && req.password === "AdminPassword") {
      const adminId = "admin-" + randomUUID();
      const token = Buffer.from(`${adminId}:${Date.now()}`).toString("base64");
      
      return {
        success: true,
        adminId,
        token,
      };
    }

    return {
      success: false,
      message: "Invalid credentials",
    };
  }
);
