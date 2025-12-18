import { api } from "encore.dev/api";
import db from "../db";
import type { MarkErrorResolvedRequest } from "./types";

export const markErrorResolved = api(
  { method: "POST", path: "/errors/mark-resolved", expose: true },
  async (req: MarkErrorResolvedRequest): Promise<{ success: boolean }> => {
    try {
      await db.exec`
        UPDATE client_errors
        SET 
          resolved = true,
          admin_notes = ${req.admin_notes || null},
          updated_at = NOW()
        WHERE id = ${req.error_id}
      `;
      
      return { success: true };
    } catch (error) {
      console.error("Failed to mark error as resolved:", error);
      return { success: false };
    }
  }
);
