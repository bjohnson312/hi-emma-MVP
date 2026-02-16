import { api } from "encore.dev/api";
import db from "../db";
import type { ToggleCampaignRequest, ToggleCampaignResponse, SMSCampaign } from "./types";

export const toggleCampaign = api(
  { expose: true, method: "POST", path: "/sms-campaigns/toggle", auth: false },
  async (req: ToggleCampaignRequest): Promise<ToggleCampaignResponse> => {
    const { id, is_active } = req;
    
    try {
      const campaign = await db.queryRow<SMSCampaign>`
        UPDATE scheduled_sms_campaigns
        SET is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      return { success: true, campaign };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
);
