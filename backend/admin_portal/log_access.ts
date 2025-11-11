import { api } from "encore.dev/api";
import db from "../db";
import type { LogAccessRequest, LogAccessResponse } from "./admin_types";

export const logAccess = api(
  { method: "POST", path: "/admin/log-access", expose: true, auth: false },
  async (req: LogAccessRequest): Promise<LogAccessResponse> => {
    try {
      await db.query`
        INSERT INTO user_access_logs (user_id, action)
        VALUES (${req.userId}::uuid, ${req.action})
      `;

      await db.query`
        UPDATE users
        SET login_count = COALESCE(login_count, 0) + 1,
            last_login = NOW()
        WHERE id = ${req.userId}::uuid
      `;

      return { success: true };
    } catch (error) {
      console.error("Failed to log access:", error);
      return { success: false };
    }
  }
);
