import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import db from "../db";
import type { GetDailySummaryRequest } from "./types";
import { generateDailySummary } from "./generate_summary";

interface GenerateSummariesResponse {
  generated: number;
  skipped: number;
  date: string;
}

export const generateDailySummariesHandler = api<void, GenerateSummariesResponse>(
  { expose: false, method: "POST", path: "/internal/generate-daily-summaries" },
  async () => {
  // Generate summaries for yesterday's activity
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const usersQuery = await db.query<{ user_id: string }>`
    SELECT DISTINCT user_id
    FROM user_profiles
  `;
  
  const users = [];
  for await (const user of usersQuery) {
    users.push(user);
  }

  let generated = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const existingSummary = await db.queryRow<{ id: number }>`
        SELECT id 
        FROM wellness_journal_entries
        WHERE user_id = ${user.user_id} 
          AND entry_date = ${yesterday}
          AND entry_type = 'daily_summary'
      `;

      if (existingSummary) {
        skipped++;
        continue;
      }

      const hasActivity = await db.queryRow<{ count: number }>`
        SELECT (
          (SELECT COUNT(*) FROM morning_routine_logs WHERE user_id = ${user.user_id} AND date = ${yesterday}) +
          (SELECT COUNT(*) FROM evening_routine_logs WHERE user_id = ${user.user_id} AND date = ${yesterday}) +
          (SELECT COUNT(*) FROM mood_logs WHERE user_id = ${user.user_id} AND date = ${yesterday}) +
          (SELECT COUNT(*) FROM diet_nutrition_logs WHERE user_id = ${user.user_id} AND date = ${yesterday}) +
          (SELECT COUNT(*) FROM medication_logs WHERE user_id = ${user.user_id} AND taken_at >= ${yesterday} AND taken_at < ${new Date(yesterday.getTime() + 86400000)})
        ) as count
      `;

      if (!hasActivity || hasActivity.count === 0) {
        skipped++;
        continue;
      }

      const request: GetDailySummaryRequest = {
        user_id: user.user_id,
        date: yesterday
      };

      await generateDailySummary(request);
      generated++;
    } catch (error) {
      console.error(`Failed to generate daily summary for user ${user.user_id}:`, error);
    }
  }

  return { generated, skipped, date: yesterday.toISOString() };
});

// Temporarily disabled
// const generateDailySummaries = new CronJob("generate-daily-summaries", {
//   title: "Generate Daily Wellness Summaries",
//   schedule: "0 1 * * *",
//   endpoint: generateDailySummariesHandler,
// });
