import { api } from "encore.dev/api";
import db from "../db";
import type { MorningRoutineCompletion } from "./routine_types";

interface GetRoutineHistoryRequest {
  user_id: string;
  start_date?: Date;
  end_date?: Date;
  limit?: number;
}

interface GetRoutineHistoryResponse {
  completions: MorningRoutineCompletion[];
}

export const getRoutineHistory = api<GetRoutineHistoryRequest, GetRoutineHistoryResponse>(
  { expose: true, method: "GET", path: "/morning_routine/history/:user_id" },
  async (req) => {
    const { user_id, start_date, end_date, limit = 30 } = req;

    let query = `
      SELECT * FROM morning_routine_completions
      WHERE user_id = $1
    `;
    const params: any[] = [user_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND completion_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND completion_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY completion_date DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const completions = await db.rawQueryAll<MorningRoutineCompletion>(query, ...params);
    return { completions };
  }
);
