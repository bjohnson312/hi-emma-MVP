import { api } from "encore.dev/api";
import db from "../db";
import type { UnenrollUserRequest, UnenrollUserResponse } from "./types";

export const unenrollUser = api(
  { expose: true, method: "POST", path: "/challenges/unenroll", auth: false },
  async (req: UnenrollUserRequest): Promise<UnenrollUserResponse> => {
    try {
      await db.exec`
        UPDATE challenge_enrollments
        SET is_active = false
        WHERE challenge_id = ${req.challenge_id} AND user_id = ${req.user_id}
      `;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || "Unknown error" };
    }
  }
);
