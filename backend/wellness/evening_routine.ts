import { api } from "encore.dev/api";
import db from "../db";
import type { LogEveningRoutineRequest, EveningRoutineLog, GetLogsRequest } from "./types";
import { autoCreateEveningEntry } from "../wellness_journal/auto_create";

export const logEveningRoutine = api<LogEveningRoutineRequest, EveningRoutineLog>(
  { expose: true, method: "POST", path: "/wellness/evening-routine" },
  async (req) => {
    const { user_id, wind_down_activities, screen_time_minutes, dinner_time, bedtime, notes } = req;

    const result = await db.queryRow<EveningRoutineLog>`
      INSERT INTO evening_routine_logs 
        (user_id, wind_down_activities, screen_time_minutes, dinner_time, bedtime, notes)
      VALUES 
        (${user_id}, ${wind_down_activities || null}, ${screen_time_minutes || null}, 
         ${dinner_time || null}, ${bedtime || null}, ${notes || null})
      RETURNING id, user_id, date, wind_down_activities, screen_time_minutes, 
                dinner_time, bedtime, notes, created_at
    `;

    await autoCreateEveningEntry(
      user_id,
      wind_down_activities || [],
      screen_time_minutes,
      bedtime,
      notes,
      result!.id
    );

    return result!;
  }
);

interface GetEveningRoutineLogsResponse {
  logs: EveningRoutineLog[];
}

export const getEveningRoutineLogs = api<GetLogsRequest, GetEveningRoutineLogsResponse>(
  { expose: true, method: "GET", path: "/wellness/evening-routine/:user_id" },
  async (req) => {
    const { user_id, start_date, end_date, limit = 30 } = req;

    let query = `
      SELECT id, user_id, date, wind_down_activities, screen_time_minutes, 
             dinner_time, bedtime, notes, created_at
      FROM evening_routine_logs
      WHERE user_id = $1
    `;
    const params: any[] = [user_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY date DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const logs = await db.rawQueryAll<EveningRoutineLog>(query, ...params);
    return { logs };
  }
);
