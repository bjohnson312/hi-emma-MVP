import { api } from "encore.dev/api";
import db from "../db";

export interface UpdateMorningPreferencesRequest {
  user_id: string;
  wake_time?: string;
  stretching?: boolean;
  gratitude?: boolean;
  music_genre?: string;
  meditation?: boolean;
}

export interface UpdateMorningPreferencesResponse {
  success: boolean;
}

export const updateMorningPreferences = api<UpdateMorningPreferencesRequest, UpdateMorningPreferencesResponse>(
  { expose: true, method: "POST", path: "/profile/morning-preferences" },
  async (req) => {
    const { user_id, wake_time, stretching, gratitude, music_genre, meditation } = req;

    const preferences: Record<string, any> = {};
    if (stretching !== undefined) preferences.stretching = stretching;
    if (gratitude !== undefined) preferences.gratitude = gratitude;
    if (music_genre) preferences.music_genre = music_genre;
    if (meditation !== undefined) preferences.meditation = meditation;

    if (wake_time) {
      await db.exec`
        UPDATE user_profiles
        SET wake_time = ${wake_time},
            morning_routine_preferences = COALESCE(morning_routine_preferences, '{}'::jsonb) || ${JSON.stringify(preferences)}::jsonb,
            updated_at = NOW()
        WHERE user_id = ${user_id}
      `;
    } else {
      await db.exec`
        UPDATE user_profiles
        SET morning_routine_preferences = COALESCE(morning_routine_preferences, '{}'::jsonb) || ${JSON.stringify(preferences)}::jsonb,
            updated_at = NOW()
        WHERE user_id = ${user_id}
      `;
    }

    return { success: true };
  }
);
