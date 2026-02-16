import { api } from "encore.dev/api";
import db from "../db";
import type { ToggleCampaignRequest, ToggleCampaignResponse, SMSCampaign } from "./types";

export const toggleCampaign = api(
  { expose: true, method: "POST", path: "/sms-campaigns/toggle", auth: false },
  async (req: ToggleCampaignRequest): Promise<ToggleCampaignResponse> => {
    const { id, is_active } = req;
    
    try {
      const existingCampaign = await db.queryRow<SMSCampaign>`
        SELECT * FROM scheduled_sms_campaigns WHERE id = ${id}
      `;
      
      if (!existingCampaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      let nextRunAt: Date | null = null;
      if (is_active) {
        const nextRunAtResult = await db.queryRow<{ next_run_at: Date }>`
          SELECT 
            CASE 
              WHEN (CURRENT_DATE + ${existingCampaign.schedule_time}::TIME) AT TIME ZONE ${existingCampaign.timezone} > NOW()
              THEN (CURRENT_DATE + ${existingCampaign.schedule_time}::TIME) AT TIME ZONE ${existingCampaign.timezone}
              ELSE ((CURRENT_DATE + INTERVAL '1 day') + ${existingCampaign.schedule_time}::TIME) AT TIME ZONE ${existingCampaign.timezone}
            END as next_run_at
        `;
        
        if (nextRunAtResult) {
          nextRunAt = nextRunAtResult.next_run_at;
        }
      }
      
      const campaign = await db.queryRow<SMSCampaign>`
        UPDATE scheduled_sms_campaigns
        SET is_active = ${is_active}, 
            next_run_at = ${nextRunAt},
            updated_at = NOW()
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
