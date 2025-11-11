import { api } from "encore.dev/api";
import db from "../db";
import type { MorningRoutineActivity, MorningRoutinePreference } from "./routine_types";

interface AddActivityRequest {
  user_id: string;
  activity: MorningRoutineActivity;
}

export const addActivity = api<AddActivityRequest, MorningRoutinePreference>(
  { expose: true, method: "POST", path: "/morning_routine/activity/add" },
  async (req) => {
    const { user_id, activity } = req;

    const existing = await db.queryRow<MorningRoutinePreference>`
      SELECT * FROM morning_routine_preferences
      WHERE user_id = ${user_id} AND is_active = true
    `;

    if (!existing) {
      throw new Error("No active morning routine found. Please create a routine first.");
    }

    const currentActivities = typeof existing.activities === 'string' 
      ? JSON.parse(existing.activities)
      : existing.activities;

    const activitiesArray: MorningRoutineActivity[] = Array.isArray(currentActivities) 
      ? currentActivities 
      : [];

    const isDuplicate = activitiesArray.some(
      a => a.name.toLowerCase() === activity.name.toLowerCase()
    );

    if (isDuplicate) {
      throw new Error(`Activity "${activity.name}" is already in your routine.`);
    }

    const newActivities = [...activitiesArray, activity];
    const newDuration = (existing.duration_minutes || 0) + (activity.duration_minutes || 0);

    const updated = await db.queryRow<MorningRoutinePreference>`
      UPDATE morning_routine_preferences
      SET activities = ${JSON.stringify(newActivities)},
          duration_minutes = ${newDuration},
          updated_at = NOW()
      WHERE user_id = ${user_id} AND is_active = true
      RETURNING *
    `;

    return updated!;
  }
);
