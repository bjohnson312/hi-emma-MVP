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

    const topUsers = [];
    for await (const row of db.query`
      SELECT 
        u.id::text as user_id,
        u.email,
        COUNT(cs.id)::int as conversation_count
      FROM users u
      LEFT JOIN conversation_sessions cs ON cs.user_id = u.id
      GROUP BY u.id, u.email
      ORDER BY conversation_count DESC
      LIMIT 10
    `) {
      topUsers.push({
        userId: row.user_id as string,
        email: (row.email as string) || 'N/A',
        conversationCount: row.conversation_count as number,
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
      },
      topUsers,
    };
  }
);
