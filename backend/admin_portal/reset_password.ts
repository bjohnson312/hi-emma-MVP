import { api } from "encore.dev/api";
import db from "../db";
import type { ResetPasswordRequest, ResetPasswordResponse } from "./types";

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export const resetPassword = api(
  { method: "POST", path: "/admin/users/reset-password", expose: true, auth: false },
  async (req: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    try {
      const temporaryPassword = generateTemporaryPassword();
      
      let userEmail = '';
      for await (const row of db.query`
        SELECT email
        FROM users
        WHERE id = ${req.userId}
      `) {
        userEmail = row.email as string;
      }

      if (!userEmail) {
        return {
          success: false,
          message: "User not found",
        };
      }

      console.log(`[Admin] Password reset requested for user ${req.userId} (${userEmail})`);
      console.log(`[Admin] Temporary password generated: ${temporaryPassword}`);
      
      return {
        success: true,
        message: `Password reset initiated for ${userEmail}`,
        temporaryPassword,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to reset password",
      };
    }
  }
);
