import { api } from "encore.dev/api";
import db from "../db";
import type { EnrollUsersRequest, EnrollUsersResponse } from "./types";

export const enrollUsers = api(
  { expose: true, method: "POST", path: "/challenges/enroll", auth: false },
  async (req: EnrollUsersRequest): Promise<EnrollUsersResponse> => {
    const { challenge_id, users, start_date } = req;

    if (!users || users.length === 0) {
      return { success: false, enrolled_count: 0, error: "No users provided" };
    }

    const startDateVal = start_date || new Date().toISOString().split("T")[0];

    let enrolledCount = 0;
    for (const user of users) {
      if (!user.user_id || !user.phone_number) continue;
      try {
        await db.exec`
          INSERT INTO challenge_enrollments (challenge_id, user_id, phone_number, start_date, current_day)
          VALUES (${challenge_id}, ${user.user_id}, ${user.phone_number}, ${startDateVal}::DATE, 0)
          ON CONFLICT (challenge_id, user_id) DO UPDATE SET
            phone_number = EXCLUDED.phone_number,
            start_date = EXCLUDED.start_date,
            current_day = 0,
            is_active = true
        `;
        enrolledCount++;
      } catch {
        // skip individual failures
      }
    }

    return { success: true, enrolled_count: enrolledCount };
  }
);
