import { api } from "encore.dev/api";
import db from "../db";
import type { UserInsight } from "./types";

export interface GetInsightsRequest {
  user_id: string;
  limit?: number;
  acknowledged?: boolean;
}

export interface GetInsightsResponse {
  insights: UserInsight[];
}

export const getInsights = api(
  { method: "POST", path: "/profile/insights", expose: true },
  async (req: GetInsightsRequest): Promise<GetInsightsResponse> => {
    const limit = req.limit || 20;

    let rowsQuery;
    if (req.acknowledged !== undefined) {
      rowsQuery = await db.query`
        SELECT 
          id, user_id, insight_type, insight_category, title, description,
          recommendations, data_points, generated_at, acknowledged, 
          acknowledged_at, created_at
        FROM user_insights
        WHERE user_id = ${req.user_id} AND acknowledged = ${req.acknowledged}
        ORDER BY generated_at DESC
        LIMIT ${limit}
      `;
    } else {
      rowsQuery = await db.query`
        SELECT 
          id, user_id, insight_type, insight_category, title, description,
          recommendations, data_points, generated_at, acknowledged, 
          acknowledged_at, created_at
        FROM user_insights
        WHERE user_id = ${req.user_id}
        ORDER BY generated_at DESC
        LIMIT ${limit}
      `;
    }
    
    const rows = [];
    for await (const row of rowsQuery) {
      rows.push(row);
    }

    const insights: UserInsight[] = rows.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      insight_type: row.insight_type,
      insight_category: row.insight_category,
      title: row.title,
      description: row.description,
      recommendations: row.recommendations || [],
      data_points: row.data_points || {},
      generated_at: row.generated_at,
      acknowledged: row.acknowledged,
      acknowledged_at: row.acknowledged_at,
      created_at: row.created_at,
    }));

    return { insights };
  }
);
