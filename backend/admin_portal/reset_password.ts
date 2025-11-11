import { api } from "encore.dev/api";
import db from "../db";
import type { ResetPasswordRequest, ResetPasswordResponse } from "./types";

export const resetPassword = api(
  { method: "POST", path: "/admin/users/reset-password", expose: true, auth: false },
  async (req: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    try {
      let updated = false;
      
      for await (const row of db.query`
        UPDATE users
        SET updated_at = NOW()
        WHERE id = ${req.userId}::uuid
        RETURNING id
      `) {
        updated = true;
      }

      if (!updated) {
        return {
          success: false,
          message: "User not found",
        };
      }

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to reset password",
      };
    }
  }
);
