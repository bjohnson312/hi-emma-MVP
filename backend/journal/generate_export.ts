import { api } from "encore.dev/api";
import db from "../db";
import type { 
  GenerateExportRequest, 
  GenerateExportResponse, 
  JournalEntry,
  ConversationEntry,
  DataCategory 
} from "./types";
import type { UserProfile } from "../profile/types";

export const generateExport = api<GenerateExportRequest, GenerateExportResponse>(
  { expose: true, method: "POST", path: "/journal/generate-export" },
  async (req) => {
    const { user_id, start_date, end_date, categories, include_conversations } = req;

    const profile = await db.queryRow<UserProfile>`
      SELECT id, user_id, name, created_at, updated_at
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;

    const entries: JournalEntry[] = [];

    if (categories.includes("morning_routine")) {
      const morningLogsQuery = await db.query<any>`
        SELECT date, sleep_quality, selected_action, notes, created_at
        FROM morning_routine_logs
        WHERE user_id = ${user_id} AND date >= ${start_date} AND date <= ${end_date}
        ORDER BY date DESC
      `;
      const morningLogs = [];
      for await (const log of morningLogsQuery) {
        morningLogs.push(log);
      }

      entries.push(...morningLogs.map((log: any) => ({
        date: log.date,
        category: "Morning Routine",
        content: {
          sleep_quality: log.sleep_quality,
          action: log.selected_action,
          notes: log.notes
        }
      })));
    }

    if (categories.includes("evening_routine")) {
      const eveningLogsQuery = await db.query<any>`
        SELECT date, wind_down_activities, screen_time_minutes, dinner_time, bedtime, notes, created_at
        FROM evening_routine_logs
        WHERE user_id = ${user_id} AND date >= ${start_date} AND date <= ${end_date}
        ORDER BY date DESC
      `;
      const eveningLogs = [];
      for await (const log of eveningLogsQuery) {
        eveningLogs.push(log);
      }

      entries.push(...eveningLogs.map((log: any) => ({
        date: log.date,
        category: "Evening Routine",
        content: {
          wind_down_activities: log.wind_down_activities,
          screen_time_minutes: log.screen_time_minutes,
          dinner_time: log.dinner_time,
          bedtime: log.bedtime,
          notes: log.notes
        }
      })));
    }

    if (categories.includes("mood")) {
      const moodLogsQuery = await db.query<any>`
        SELECT date, mood_rating, mood_tags, energy_level, stress_level, notes, triggers, created_at
        FROM mood_logs
        WHERE user_id = ${user_id} AND date >= ${start_date} AND date <= ${end_date}
        ORDER BY date DESC
      `;
      const moodLogs = [];
      for await (const log of moodLogsQuery) {
        moodLogs.push(log);
      }

      entries.push(...moodLogs.map((log: any) => ({
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
      })));
    }

    if (categories.includes("nutrition")) {
      const mealLogsQuery = await db.query<any>`
        SELECT date, meal_type, meal_time, description, water_intake_oz, energy_level, notes, created_at
        FROM diet_nutrition_logs
        WHERE user_id = ${user_id} AND date >= ${start_date} AND date <= ${end_date}
        ORDER BY date DESC
      `;
      const mealLogs = [];
      for await (const log of mealLogsQuery) {
        mealLogs.push(log);
      }

      entries.push(...mealLogs.map((log: any) => ({
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
      })));
    }

    if (categories.includes("medication")) {
      const medicationLogsQuery = await db.query<any>`
        SELECT ml.taken_at, ml.scheduled_time, ml.notes, 
               do_.medication_name, do_.dosage, do_.frequency
        FROM medication_logs ml
        LEFT JOIN doctors_orders do_ ON ml.doctors_order_id = do_.id
        WHERE ml.user_id = ${user_id} AND ml.taken_at >= ${start_date} AND ml.taken_at <= ${end_date}
        ORDER BY ml.taken_at DESC
      `;
      const medicationLogs = [];
      for await (const log of medicationLogsQuery) {
        medicationLogs.push(log);
      }

      entries.push(...medicationLogs.map((log: any) => ({
        date: log.taken_at,
        category: "Medication",
        content: {
          medication_name: log.medication_name,
          dosage: log.dosage,
          frequency: log.frequency,
          scheduled_time: log.scheduled_time,
          notes: log.notes
        }
      })));
    }

    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let conversations: ConversationEntry[] | undefined;
    if (include_conversations) {
      const conversationSessionsQuery = await db.query<any>`
        SELECT id, user_id, session_type, context, started_at, completed
        FROM conversation_sessions
        WHERE user_id = ${user_id} 
          AND started_at >= ${start_date} 
          AND started_at <= ${end_date}
          AND completed = true
        ORDER BY started_at DESC
      `;
      const conversationSessions = [];
      for await (const session of conversationSessionsQuery) {
        conversationSessions.push(session);
      }

      conversations = conversationSessions.map((session: any) => {
        const context = session.context || {};
        const messages = context.messages || [];
        
        return {
          date: session.started_at,
          session_type: session.session_type,
          messages: messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : session.started_at
          }))
        };
      });
    }

    const categoryCounts: Record<string, number> = {};
    entries.forEach(entry => {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
    });

    return {
      user_name: profile?.name || "Unknown User",
      export_date: new Date(),
      date_range: {
        start: start_date,
        end: end_date
      },
      included_categories: categories,
      entries,
      conversations,
      summary: {
        total_entries: entries.length,
        categories: categoryCounts
      }
    };
  }
);
