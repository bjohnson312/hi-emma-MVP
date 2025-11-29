import { api } from "encore.dev/api";
import db from "../db";
import type { MorningRoutinePreference } from "./routine_types";
import { parseActivities } from "./activity_utils";

interface ListActivitiesRequest {
  user_id: string;
}

interface ListActivitiesResponse {
  activities: Array<{
    id: string;
    name: string;
    duration_minutes?: number;
    icon?: string;
    description?: string;
  }>;
  total_duration: number;
  routine_name?: string;
  wake_time?: string;
}

export const listActivities = api<ListActivitiesRequest, ListActivitiesResponse>(
  { expose: true, method: "GET", path: "/morning_routine/activities/:user_id" },
  async (req) => {
    const { user_id } = req;

    const routine = await db.queryRow<MorningRoutinePreference>`
      SELECT * FROM morning_routine_preferences
      WHERE user_id = ${user_id} AND is_active = true
    `;

    if (!routine) {
      return {
        activities: [],
        total_duration: 0
      };
    }

    const activities = parseActivities(routine.activities);

    return {
      activities,
      total_duration: routine.duration_minutes || 0,
      routine_name: routine.routine_name,
      wake_time: routine.wake_time
    };
  }
);
