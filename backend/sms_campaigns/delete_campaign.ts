import { api } from "encore.dev/api";
import db from "../db";
import type { DeleteCampaignRequest, DeleteCampaignResponse } from "./types";

export const deleteCampaign = api(
  { expose: true, method: "POST", path: "/sms-campaigns/delete", auth: false },
  async (req: DeleteCampaignRequest): Promise<DeleteCampaignResponse> => {
    const { id } = req;
    
    try {
      await db.exec`
        DELETE FROM scheduled_sms_campaigns
        WHERE id = ${id}
      `;
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
);
