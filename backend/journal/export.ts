import { api } from "encore.dev/api";
import db from "../db";
import type { ExportJournalRequest, ExportJournalResponse, JournalEntry } from "./types";
import type { UserProfile } from "../profile/types";

export const exportJournal = api<ExportJournalRequest, ExportJournalResponse>(
  { expose: true, method: "POST", path: "/journal/export" },
  async (req) => {
    const { user_id, start_date, end_date } = req;

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = now;

    const startDate = start_date || defaultStartDate;
    const endDate = end_date || defaultEndDate;

    const profile = await db.queryRow<UserProfile>`
      SELECT id, user_id, name, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;

    const morningLogsQuery = await db.query<any>`
      SELECT date, sleep_quality, selected_action, notes, created_at
      FROM morning_routine_logs
      WHERE user_id = ${user_id} AND date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC
    `;
    const morningLogs = [];
    for await (const log of morningLogsQuery) {
      morningLogs.push(log);
    }

    const eveningLogsQuery = await db.query<any>`
      SELECT date, wind_down_activities, screen_time_minutes, dinner_time, bedtime, notes, created_at
      FROM evening_routine_logs
      WHERE user_id = ${user_id} AND date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC
    `;
    const eveningLogs = [];
    for await (const log of eveningLogsQuery) {
      eveningLogs.push(log);
    }

    const moodLogsQuery = await db.query<any>`
      SELECT date, mood_rating, mood_tags, energy_level, stress_level, notes, triggers, created_at
      FROM mood_logs
      WHERE user_id = ${user_id} AND date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC
    `;
    const moodLogs = [];
    for await (const log of moodLogsQuery) {
      moodLogs.push(log);
    }

    const mealLogsQuery = await db.query<any>`
      SELECT date, meal_type, meal_time, description, water_intake_oz, energy_level, notes, created_at
      FROM diet_nutrition_logs
      WHERE user_id = ${user_id} AND date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC
    `;
    const mealLogs = [];
    for await (const log of mealLogsQuery) {
      mealLogs.push(log);
    }

    const medicationLogsQuery = await db.query<any>`
      SELECT ml.taken_at, ml.scheduled_time, ml.notes, 
             do_.medication_name, do_.dosage, do_.frequency
      FROM medication_logs ml
      LEFT JOIN doctors_orders do_ ON ml.doctors_order_id = do_.id
      WHERE ml.user_id = ${user_id} AND ml.taken_at >= ${startDate} AND ml.taken_at <= ${endDate}
      ORDER BY ml.taken_at DESC
    `;
    const medicationLogs = [];
    for await (const log of medicationLogsQuery) {
      medicationLogs.push(log);
    }

    const entries: JournalEntry[] = [
      ...morningLogs.map((log: any) => ({
        date: log.date,
        category: "Morning Routine",
        content: {
          sleep_quality: log.sleep_quality,
          action: log.selected_action,
          notes: log.notes
        }
      })),
      ...eveningLogs.map((log: any) => ({
        date: log.date,
        category: "Evening Routine",
        content: {
          wind_down_activities: log.wind_down_activities,
          screen_time_minutes: log.screen_time_minutes,
          dinner_time: log.dinner_time,
          bedtime: log.bedtime,
          notes: log.notes
        }
      })),
      ...moodLogs.map((log: any) => ({
        date: log.date,
        category: "Mood Tracking",
        content: {
          mood_rating: log.mood_rating,
          mood_tags: log.mood_tags,
          energy_level: log.energy_level,
          stress_level: log.stress_level,
          notes: log.notes,
          triggers: log.triggers
        }
      })),
      ...mealLogs.map((log: any) => ({
        date: log.date,
        category: "Diet & Nutrition",
        content: {
          meal_type: log.meal_type,
          meal_time: log.meal_time,
          description: log.description,
          water_intake_oz: log.water_intake_oz,
          energy_level: log.energy_level,
          notes: log.notes
        }
      })),
      ...medicationLogs.map((log: any) => ({
        date: log.taken_at,
        category: "Medication",
        content: {
          medication_name: log.medication_name,
          dosage: log.dosage,
          frequency: log.frequency,
          scheduled_time: log.scheduled_time,
          notes: log.notes
        }
      }))
    ];

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const categoryCounts: Record<string, number> = {};
    entries.forEach(entry => {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    });

    return {
      user_name: profile?.name || "Unknown User",
      export_date: now,
      date_range: {
        start: startDate,
        end: endDate
      },
      entries,
      summary: {
        total_entries: entries.length,
        categories: categoryCounts,
        morning_routines: morningLogs.length,
        evening_routines: eveningLogs.length,
        mood_logs: moodLogs.length,
        meal_logs: mealLogs.length,
        medications_taken: medicationLogs.length
      }
    };
  }
);
