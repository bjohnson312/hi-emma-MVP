import { api } from "encore.dev/api";
import db from "../db";
import type { DeactivateUserRequest, DeactivateUserResponse } from "./admin_types";

export const deactivateUser = api(
  { method: "POST", path: "/admin/users/deactivate", expose: true, auth: false },
  async (req: DeactivateUserRequest): Promise<DeactivateUserResponse> => {
    try {
      let updated = false;
      
      for await (const row of db.query`
        UPDATE users
        SET is_active = false,
            updated_at = NOW()
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
        message: "User deactivated successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to deactivate user",
      };
    }
  }
);
