import { api } from "encore.dev/api";
import db from "../db";
import type { LogMoodRequest, MoodLog, GetLogsRequest } from "./types";
import { autoCreateMoodEntry } from "../wellness_journal/auto_create";

export const logMood = api<LogMoodRequest, MoodLog>(
  { expose: true, method: "POST", path: "/wellness/mood" },
  async (req) => {
    const { user_id, mood_rating, mood_tags, energy_level, stress_level, notes, triggers } = req;

    const result = await db.queryRow<MoodLog>`
      INSERT INTO mood_logs 
        (user_id, mood_rating, mood_tags, energy_level, stress_level, notes, triggers)
      VALUES 
        (${user_id}, ${mood_rating}, ${mood_tags || null}, ${energy_level || null}, 
         ${stress_level || null}, ${notes || null}, ${triggers || null})
      RETURNING id, user_id, date, mood_rating, mood_tags, energy_level, 
                stress_level, notes, triggers, created_at
    `;

    await autoCreateMoodEntry(
      user_id,
      mood_rating,
      mood_tags,
      energy_level,
      stress_level,
      notes,
      triggers,
      result!.id
    );

    return result!;
  }
);

interface GetMoodLogsResponse {
  logs: MoodLog[];
}

export const getMoodLogs = api<GetLogsRequest, GetMoodLogsResponse>(
  { expose: true, method: "GET", path: "/wellness/moods/:user_id" },
  async (req) => {
    const { user_id, start_date, end_date, limit = 30 } = req;

    let query = `
      SELECT id, user_id, date, mood_rating, mood_tags, energy_level, 
             stress_level, notes, triggers, created_at
      FROM mood_logs
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

    const logs = await db.rawQueryAll<MoodLog>(query, ...params);
    return { logs };
  }
);
