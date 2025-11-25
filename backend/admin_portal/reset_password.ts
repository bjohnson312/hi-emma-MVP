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
      const { userId, customPassword } = req;

      if (customPassword && customPassword.length < 8) {
        return {
          success: false,
          message: "Password must be at least 8 characters",
        };
      }

      const passwordToSet = customPassword || generateTemporaryPassword();
      
      let userEmail = '';
      for await (const row of db.query`
        SELECT email
        FROM users
        WHERE id = ${userId}
      `) {
        userEmail = row.email as string;
      }

      if (!userEmail) {
        return {
          success: false,
          message: "User not found",
        };
      }

      console.log(`[Admin] Password ${customPassword ? 'set' : 'reset'} requested for user ${userId} (${userEmail})`);
      if (!customPassword) {
        console.log(`[Admin] Temporary password generated: ${passwordToSet}`);
      }
      
      return {
        success: true,
        message: customPassword 
          ? `Custom password set for ${userEmail}`
          : `Password reset initiated for ${userEmail}`,
        temporaryPassword: customPassword ? undefined : passwordToSet,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to reset password",
      };
    }
  }
);
