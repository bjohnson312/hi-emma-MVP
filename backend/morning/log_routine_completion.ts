import { api } from "encore.dev/api";
import db from "../db";
import type { LogRoutineCompletionRequest, MorningRoutineCompletion } from "./routine_types";
import { updateJourneyProgress } from "../journey/update_progress";
import { autoCreateMorningRoutineEntry } from "../wellness_journal/auto_create";

export const logRoutineCompletion = api<LogRoutineCompletionRequest, MorningRoutineCompletion>(
  { expose: true, method: "POST", path: "/morning_routine/completion/log" },
  async (req) => {
    const { user_id, activities_completed, all_completed, notes, mood_rating, energy_level } = req;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.queryRow<{ id: number }>`
      SELECT id FROM morning_routine_completions
      WHERE user_id = ${user_id} AND completion_date = ${today}
    `;

    let completion: MorningRoutineCompletion | null = null;

    if (existing) {
      completion = await db.queryRow<MorningRoutineCompletion>`
        UPDATE morning_routine_completions
        SET activities_completed = ${JSON.stringify(activities_completed)},
            all_completed = ${all_completed},
            notes = ${notes},
            mood_rating = ${mood_rating},
            energy_level = ${energy_level}
        WHERE id = ${existing.id}
        RETURNING *
      `;
    } else {
      completion = await db.queryRow<MorningRoutineCompletion>`
        INSERT INTO morning_routine_completions (
          user_id, completion_date, activities_completed, all_completed, notes, mood_rating, energy_level
        ) VALUES (
          ${user_id}, ${today}, ${JSON.stringify(activities_completed)}, ${all_completed}, ${notes}, ${mood_rating}, ${energy_level}
        )
        RETURNING *
      `;
    }

    if (all_completed) {
      await updateJourneyProgress(user_id, "morning_routine_completed", true);
      
      await autoCreateMorningRoutineEntry(
        user_id,
        activities_completed,
        mood_rating,
        energy_level,
        notes,
        completion!.id
      );
    }

    return completion!;
  }
);
