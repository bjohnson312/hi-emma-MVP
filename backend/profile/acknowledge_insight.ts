import { api } from "encore.dev/api";
import db from "../db";

export interface AcknowledgeInsightRequest {
  user_id: string;
  insight_id: number;
}

export interface AcknowledgeInsightResponse {
  success: boolean;
}

export const acknowledgeInsight = api(
  { method: "POST", path: "/profile/insights/acknowledge", expose: true },
  async (req: AcknowledgeInsightRequest): Promise<AcknowledgeInsightResponse> => {

    await db.exec`
      UPDATE user_insights
      SET acknowledged = true, acknowledged_at = NOW()
      WHERE id = ${req.insight_id} AND user_id = ${req.user_id}
    `;

    return { success: true };
  }
);
