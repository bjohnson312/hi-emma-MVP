import { api } from "encore.dev/api";
import db from "../db";
import type { GetStatsRequest, GetStatsResponse } from "./types";

function parseJsonField<T>(field: any): T {
  if (typeof field === 'string') {
    return JSON.parse(field);
  }
  return field as T;
}

export const getStats = api<GetStatsRequest, GetStatsResponse>(
  { expose: true, method: "GET", path: "/care-plans/stats/:user_id" },
  async (req) => {
    const { user_id, days = 30 } = req;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const completionsQuery = await db.query<{
      completion_date: Date;
      all_completed: boolean;
      completed_item_ids: any;
    }>`
      SELECT completion_date, all_completed, completed_item_ids
      FROM care_plan_completions
      WHERE user_id = ${user_id}
        AND completion_date >= ${startDate}
      ORDER BY completion_date ASC
    `;

    const completions: Array<{ completion_date: Date; all_completed: boolean; completed_item_ids: any }> = [];
    for await (const completion of completionsQuery) {
      completions.push(completion);
    }

    const totalCompletions = completions.filter(c => c.all_completed).length;

    const totalDays = Math.min(days, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const completionRate = totalDays > 0 ? Math.round((totalCompletions / totalDays) * 100) : 0;

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completionDates = completions
      .filter(c => c.all_completed)
      .map(c => new Date(c.completion_date).getTime());

    for (let i = 0; i < totalDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      const checkTime = checkDate.getTime();

      if (completionDates.includes(checkTime)) {
        tempStreak++;
        if (i === 0 || currentStreak > 0) {
          currentStreak = tempStreak;
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        if (i === 0) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }

    return {
      total_completions: totalCompletions,
      completion_rate: completionRate,
      current_streak: currentStreak,
      longest_streak: longestStreak
    };
  }
);
