import { api } from "encore.dev/api";
import db from "../db";

interface DailyAccessData {
  date: string;
  count: number;
}

interface DailyAccessResponse {
  data: DailyAccessData[];
}

export const getDailyAccesses = api(
  { method: "GET", path: "/admin/daily-accesses", expose: true, auth: false },
  async (): Promise<DailyAccessResponse> => {
    const result: DailyAccessData[] = [];
    
    for await (const row of db.query`
      SELECT 
        DATE(created_at)::text as date,
        COUNT(*)::int as count
      FROM app_events
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `) {
      result.push({
        date: row.date as string,
        count: row.count as number,
      });
    }
    
    return { data: result };
  }
);
