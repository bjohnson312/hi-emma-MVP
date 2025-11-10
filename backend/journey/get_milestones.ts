import { api } from "encore.dev/api";
import db from "../db";
import type { GetMilestonesRequest, GetMilestonesResponse, WellnessMilestone } from "./types";

export const getMilestones = api<GetMilestonesRequest, GetMilestonesResponse>(
  { expose: true, method: "POST", path: "/journey/milestones/list" },
  async (req) => {
    const { user_id, limit = 50 } = req;

    const milestones = await db.query<WellnessMilestone>`
      SELECT * FROM wellness_milestones
      WHERE user_id = ${user_id}
      ORDER BY earned_at DESC
      LIMIT ${limit}
    `;

    const milestonesList = [];
    for await (const milestone of milestones) {
      milestonesList.push(milestone);
    }

    const countResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM wellness_milestones
      WHERE user_id = ${user_id}
    `;

    return {
      milestones: milestonesList,
      total_count: countResult?.count || 0
    };
  }
);
