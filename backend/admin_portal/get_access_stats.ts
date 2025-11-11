import { api } from "encore.dev/api";
import db from "../db";
import type { AccessStatsResponse } from "./admin_types";

export const getAccessStats = api(
  { method: "GET", path: "/admin/access-stats", expose: true, auth: false },
  async (): Promise<AccessStatsResponse> => {
    let totalAccess = 0;
    for await (const row of db.query`SELECT COUNT(*)::int as count FROM user_access_logs`) {
      totalAccess = row.count as number;
    }

    let uniqueUsers = 0;
    for await (const row of db.query`
      SELECT COUNT(DISTINCT user_id)::int as count FROM user_access_logs
    `) {
      uniqueUsers = row.count as number;
    }

    let todayAccess = 0;
    for await (const row of db.query`
      SELECT COUNT(*)::int as count FROM user_access_logs 
      WHERE created_at >= CURRENT_DATE
    `) {
      todayAccess = row.count as number;
    }

    let weeklyAccess = 0;
    for await (const row of db.query`
      SELECT COUNT(*)::int as count FROM user_access_logs 
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `) {
      weeklyAccess = row.count as number;
    }

    let monthlyAccess = 0;
    for await (const row of db.query`
      SELECT COUNT(*)::int as count FROM user_access_logs 
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `) {
      monthlyAccess = row.count as number;
    }

    const avgAccessPerUser = uniqueUsers > 0 ? Math.round(totalAccess / uniqueUsers) : 0;

    return {
      stats: {
        totalAccess,
        uniqueUsers,
        todayAccess,
        weeklyAccess,
        monthlyAccess,
        avgAccessPerUser,
      },
    };
  }
);
