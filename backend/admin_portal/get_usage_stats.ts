import { api } from "encore.dev/api";
import db from "../db";
import type { UsageStatsResponse } from "./types";

export const getUsageStats = api(
  { method: "GET", path: "/admin/usage-stats", expose: true, auth: false },
  async (): Promise<UsageStatsResponse> => {
    let totalUsers = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM users`) {
      totalUsers = row.count as number;
    }

    let activeUsers = 0;
    for await (const row of db.query`
      SELECT COUNT(DISTINCT user_id)::int as count 
      FROM conversation_sessions 
      WHERE created_at > NOW() - INTERVAL '30 days'
    `) {
      activeUsers = row.count as number;
    }

    let totalConversations = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM conversation_sessions`) {
      totalConversations = row.count as number;
    }

    let totalMorningRoutines = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM morning_routine_logs`) {
      totalMorningRoutines = row.count as number;
    }

    let totalJournalEntries = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM wellness_journal_entries`) {
      totalJournalEntries = row.count as number;
    }

    let totalMealPlans = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM weekly_meal_plans`) {
      totalMealPlans = row.count as number;
    }

    let totalCareTeamMembers = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM care_team_members`) {
      totalCareTeamMembers = row.count as number;
    }

    let totalWellnessEntries = 0;
    for await (const row of db.query`
      SELECT COUNT(*)::int as count FROM (
        SELECT user_id FROM mood_logs
        UNION ALL
        SELECT user_id FROM wellness_activities
      ) as all_wellness
    `) {
      totalWellnessEntries = row.count as number;
    }

    const avgSessionsPerUser = totalUsers > 0 ? Math.round(totalConversations / totalUsers * 10) / 10 : 0;

    let avgTimePerSession = 0;
    for await (const row of db.query`
      SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)))::int as avg_seconds
      FROM conversation_sessions
      WHERE updated_at > created_at
    `) {
      avgTimePerSession = (row.avg_seconds as number) || 0;
    }

    const topUsers = [];
    for await (const row of db.query`
      SELECT 
        u.id::text as user_id,
        u.email,
        COUNT(DISTINCT cs.id)::int as conversation_count,
        COUNT(DISTINCT mrl.id)::int as routine_count
      FROM users u
      LEFT JOIN conversation_sessions cs ON cs.user_id = u.id
      LEFT JOIN morning_routine_logs mrl ON mrl.user_id = u.id
      GROUP BY u.id, u.email
      ORDER BY (COUNT(DISTINCT cs.id) + COUNT(DISTINCT mrl.id)) DESC
      LIMIT 10
    `) {
      topUsers.push({
        userId: row.user_id as string,
        email: (row.email as string) || 'N/A',
        conversationCount: row.conversation_count as number,
        totalSessions: (row.conversation_count as number) + (row.routine_count as number),
      });
    }

    return {
      stats: {
        totalUsers,
        activeUsers,
        totalConversations,
        totalMorningRoutines,
        totalJournalEntries,
        totalMealPlans,
        avgSessionsPerUser,
        avgTimePerSession,
        totalCareTeamMembers,
        totalWellnessEntries,
      },
      topUsers,
    };
  }
);
