import { api } from "encore.dev/api";
import db from "../db";
import type { MorningRoutineCompletion } from "./routine_types";

interface GetTodayCompletionRequest {
  user_id: string;
}

interface GetTodayCompletionResponse {
  completion: MorningRoutineCompletion | null;
}

export const getTodayCompletion = api<GetTodayCompletionRequest, GetTodayCompletionResponse>(
  { expose: true, method: "GET", path: "/morning_routine/today/:user_id" },
  async ({ user_id }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completion = await db.queryRow<MorningRoutineCompletion>`
      SELECT * FROM morning_routine_completions
      WHERE user_id = ${user_id} AND completion_date = ${today}
    `;

    return { completion: completion || null };
  }
);
