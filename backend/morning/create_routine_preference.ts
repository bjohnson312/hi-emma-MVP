import { api } from "encore.dev/api";
import db from "../db";
import type { CreateRoutinePreferenceRequest, MorningRoutinePreference } from "./routine_types";

export const createRoutinePreference = api<CreateRoutinePreferenceRequest, MorningRoutinePreference>(
  { expose: true, method: "POST", path: "/morning_routine/preference/create" },
  async (req) => {
    const { user_id, routine_name, activities, wake_time, duration_minutes } = req;

    const existing = await db.queryRow<{ id: number }>`
      SELECT id FROM morning_routine_preferences
      WHERE user_id = ${user_id}
    `;

    if (existing) {
      const updated = await db.queryRow<MorningRoutinePreference>`
        UPDATE morning_routine_preferences
        SET routine_name = ${routine_name},
            activities = ${JSON.stringify(activities)},
            wake_time = ${wake_time},
            duration_minutes = ${duration_minutes},
            updated_at = NOW()
        WHERE user_id = ${user_id}
        RETURNING *
      `;
      return updated!;
    }

    const preference = await db.queryRow<MorningRoutinePreference>`
      INSERT INTO morning_routine_preferences (
        user_id, routine_name, activities, wake_time, duration_minutes
      ) VALUES (
        ${user_id}, ${routine_name}, ${JSON.stringify(activities)}, ${wake_time}, ${duration_minutes}
      )
      RETURNING *
    `;

    return preference!;
  }
);
