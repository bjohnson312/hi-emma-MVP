import { api } from "encore.dev/api";
import db from "../db";
import type { GetRoutineStatsRequest, RoutineStats } from "./routine_types";

export const getRoutineStats = api<GetRoutineStatsRequest, RoutineStats>(
  { expose: true, method: "POST", path: "/morning_routine/stats" },
  async (req) => {
    const { user_id, days = 30 } = req;

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    sinceDate.setHours(0, 0, 0, 0);

    const completions = await db.query<{ completion_date: Date; all_completed: boolean; mood_rating: number | null; energy_level: number | null }>`
      SELECT completion_date, all_completed, mood_rating, energy_level
      FROM morning_routine_completions
      WHERE user_id = ${user_id} AND completion_date >= ${sinceDate}
      ORDER BY completion_date DESC
    `;

    const completionsList = [];
    for await (const c of completions) {
      completionsList.push(c);
    }

    const totalCompletions = completionsList.filter(c => c.all_completed).length;
    const daysWithActivity = completionsList.length;

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedByDate = completionsList.sort((a, b) => 
      new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime()
    );

    for (let i = 0; i < sortedByDate.length; i++) {
      const completionDate = new Date(sortedByDate[i].completion_date);
      completionDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        const daysSinceCompletion = Math.floor((today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCompletion <= 1 && sortedByDate[i].all_completed) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else if (sortedByDate[i].all_completed) {
        const prevDate = new Date(sortedByDate[i - 1].completion_date);
        prevDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((prevDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          tempStreak++;
          if (i === 0 || currentStreak > 0) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    const completionRate = days > 0 ? (totalCompletions / days) * 100 : 0;

    const moodRatings = completionsList.filter(c => c.mood_rating !== null).map(c => c.mood_rating!);
    const avgMoodRating = moodRatings.length > 0 
      ? moodRatings.reduce((sum, r) => sum + r, 0) / moodRatings.length 
      : undefined;

    const energyLevels = completionsList.filter(c => c.energy_level !== null).map(c => c.energy_level!);
    const avgEnergyLevel = energyLevels.length > 0
      ? energyLevels.reduce((sum, r) => sum + r, 0) / energyLevels.length
      : undefined;

    const lastCompletion = completionsList.length > 0 ? completionsList[0].completion_date : undefined;

    return {
      total_completions: totalCompletions,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      completion_rate: Math.round(completionRate * 10) / 10,
      avg_mood_rating: avgMoodRating ? Math.round(avgMoodRating * 10) / 10 : undefined,
      avg_energy_level: avgEnergyLevel ? Math.round(avgEnergyLevel * 10) / 10 : undefined,
      last_completion_date: lastCompletion,
      days_with_activity: daysWithActivity,
      total_days: days
    };
  }
);
