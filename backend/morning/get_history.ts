import { api } from "encore.dev/api";
import db from "../db";

interface GetHistoryRequest {
  user_id: string;
  limit?: number;
}

interface MorningLog {
  id: number;
  user_id: string;
  date: Date;
  sleep_quality: string;
  selected_action: string;
  notes?: string;
}

interface GetHistoryResponse {
  logs: MorningLog[];
}

// Retrieves the user's morning routine history.
export const getHistory = api<GetHistoryRequest, GetHistoryResponse>(
  { expose: true, method: "GET", path: "/morning_routine/history/:user_id" },
  async ({ user_id, limit = 30 }) => {
    const logsQuery = await db.query<MorningLog>`
      SELECT id, user_id, date, sleep_quality, selected_action, notes
      FROM morning_routine_logs
      WHERE user_id = ${user_id}
      ORDER BY date DESC
      LIMIT ${limit}
    `;
    const logs = [];
    for await (const log of logsQuery) {
      logs.push(log);
    }

    return { logs };
  }
);
