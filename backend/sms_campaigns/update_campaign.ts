import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateCampaignRequest, UpdateCampaignResponse, SMSCampaign } from "./types";

export const updateCampaign = api(
  { expose: true, method: "POST", path: "/sms-campaigns/update", auth: false },
  async (req: UpdateCampaignRequest): Promise<UpdateCampaignResponse> => {
    const { id, name, message_body, schedule_time, timezone, is_active, target_user_ids } = req;
    
    if (name === undefined && message_body === undefined && schedule_time === undefined && timezone === undefined && is_active === undefined && target_user_ids === undefined) {
      return { success: false, error: 'No fields to update' };
    }
    
    try {
      if (name !== undefined) {
        await db.exec`UPDATE scheduled_sms_campaigns SET name = ${name}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (message_body !== undefined) {
        await db.exec`UPDATE scheduled_sms_campaigns SET message_body = ${message_body}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (schedule_time !== undefined) {
        const scheduleTimeFull = `${schedule_time}:00`;
        await db.exec`UPDATE scheduled_sms_campaigns SET schedule_time = ${scheduleTimeFull}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (timezone !== undefined) {
        await db.exec`UPDATE scheduled_sms_campaigns SET timezone = ${timezone}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (is_active !== undefined) {
        await db.exec`UPDATE scheduled_sms_campaigns SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (target_user_ids !== undefined) {
        await db.exec`UPDATE scheduled_sms_campaigns SET target_user_ids = ${target_user_ids}, updated_at = NOW() WHERE id = ${id}`;
      }
      
      const campaign = await db.queryRow<SMSCampaign>`
        SELECT * FROM scheduled_sms_campaigns WHERE id = ${id}
      `;
      
      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }
      
      if (schedule_time !== undefined) {
        const scheduleTimeFull = `${schedule_time}:00`;
        const nextRunAtResult = await db.queryRow<{ next_run_at: Date }>`
          SELECT 
            CASE 
              WHEN (CURRENT_DATE + ${scheduleTimeFull}::TIME) AT TIME ZONE ${campaign.timezone} > NOW()
              THEN (CURRENT_DATE + ${scheduleTimeFull}::TIME) AT TIME ZONE ${campaign.timezone}
              ELSE ((CURRENT_DATE + INTERVAL '1 day') + ${scheduleTimeFull}::TIME) AT TIME ZONE ${campaign.timezone}
            END as next_run_at
        `;
        
        if (nextRunAtResult) {
          await db.exec`
            UPDATE scheduled_sms_campaigns 
            SET next_run_at = ${nextRunAtResult.next_run_at}, updated_at = NOW() 
            WHERE id = ${id}
          `;
          campaign.next_run_at = nextRunAtResult.next_run_at;
        }
      }
      
      return { success: true, campaign };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
);
