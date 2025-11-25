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

    let totalAccesses = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM app_events`) {
      totalAccesses = row.count as number;
    }

    let todayAccesses = 0;
    for await (const row of db.query`
      SELECT COUNT(*)::int as count FROM app_events 
      WHERE created_at >= CURRENT_DATE
    `) {
      todayAccesses = row.count as number;
    }

    let last7Days = 0;
    for await (const row of db.query`
      SELECT COUNT(*)::int as count FROM app_events 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `) {
      last7Days = row.count as number;
    }

    let last30Days = 0;
    for await (const row of db.query`
      SELECT COUNT(*)::int as count FROM app_events 
      WHERE created_at > NOW() - INTERVAL '30 days'
    `) {
      last30Days = row.count as number;
    }

    const avgPerUser = totalUsers > 0 ? Math.round(last30Days / totalUsers * 10) / 10 : 0;

    let activeUsers = 0;
    for await (const row of db.query`
      SELECT COUNT(DISTINCT user_id)::int as count 
      FROM app_events 
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
      SELECT COUNT(*)::int as count FROM mood_logs
    `) {
      totalWellnessEntries = row.count as number;
    }

    const avgSessionsPerUser = totalUsers > 0 ? Math.round(totalConversations / totalUsers * 10) / 10 : 0;
    const avgTimePerSession = 0;

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
        totalAccesses,
        todayAccesses,
        last7Days,
        last30Days,
        avgPerUser,
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
