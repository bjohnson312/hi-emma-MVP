import { api } from "encore.dev/api";
import db from "../db";

interface WeeklyAccessData {
  week: string;
  count: number;
}

interface WeeklyAccessResponse {
  data: WeeklyAccessData[];
}

export const getWeeklyAccesses = api(
  { method: "GET", path: "/admin/weekly-accesses", expose: true, auth: false },
  async (): Promise<WeeklyAccessResponse> => {
    const result: WeeklyAccessData[] = [];
    
    for await (const row of db.query`
      SELECT 
        DATE_TRUNC('week', created_at)::text as week,
        COUNT(*)::int as count
      FROM app_events
      WHERE created_at > NOW() - INTERVAL '12 weeks'
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY DATE_TRUNC('week', created_at)
    `) {
      result.push({
        week: row.week as string,
        count: row.count as number,
      });
    }
    
    return { data: result };
  }
);
