import { api } from "encore.dev/api";
import db from "../db";
import type { UserMilestone } from "./types";

export interface GetMilestonesRequest {
  user_id: string;
  limit?: number;
}

export interface GetMilestonesResponse {
  milestones: UserMilestone[];
}

export const getMilestones = api(
  { method: "POST", path: "/profile/milestones", expose: true },
  async (req: GetMilestonesRequest): Promise<GetMilestonesResponse> => {
    const limit = req.limit || 50;

    const rowsQuery = await db.query`
      SELECT 
        id, user_id, milestone_type, title, description,
        achieved_at, metadata, created_at
      FROM user_milestones
      WHERE user_id = ${req.user_id}
      ORDER BY achieved_at DESC
      LIMIT ${limit}
    `;
    const rows = [];
    for await (const row of rowsQuery) {
      rows.push(row);
    }

    const milestones: UserMilestone[] = rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      milestone_type: row.milestone_type,
      title: row.title,
      description: row.description,
      achieved_at: row.achieved_at,
      metadata: row.metadata || {},
      created_at: row.created_at,
    }));

    return { milestones };
  }
);
