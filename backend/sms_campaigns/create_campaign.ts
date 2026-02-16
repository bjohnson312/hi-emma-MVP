import { api } from "encore.dev/api";
import db from "../db";
import type { CreateCampaignRequest, CreateCampaignResponse, SMSCampaign } from "./types";

export const createCampaign = api(
  { expose: true, method: "POST", path: "/sms-campaigns/create", auth: false },
  async (req: CreateCampaignRequest): Promise<CreateCampaignResponse> => {
    const { name, template_name, message_body, schedule_time, timezone, target_user_ids } = req;
    
    if (!target_user_ids || target_user_ids.length === 0) {
      return { 
        success: false, 
        error: 'At least one user must be selected to send the campaign to' 
      };
    }
    
    const scheduleTimeFull = `${schedule_time}:00`;
    const tz = timezone || 'America/New_York';
    
    const nextRunAtResult = await db.queryRow<{ next_run_at: Date }>`
      SELECT 
        CASE 
          WHEN (CURRENT_DATE + ${scheduleTimeFull}::TIME) AT TIME ZONE ${tz} > NOW()
          THEN (CURRENT_DATE + ${scheduleTimeFull}::TIME) AT TIME ZONE ${tz}
          ELSE ((CURRENT_DATE + INTERVAL '1 day') + ${scheduleTimeFull}::TIME) AT TIME ZONE ${tz}
        END as next_run_at
    `;
    
    if (!nextRunAtResult) {
      return { success: false, error: 'Failed to calculate next run time' };
    }
    
    try {
      const campaign = await db.queryRow<SMSCampaign>`
        INSERT INTO scheduled_sms_campaigns (
          name, template_name, message_body, schedule_time, timezone, target_user_ids, next_run_at
        ) VALUES (
          ${name},
          ${template_name},
          ${message_body},
          ${scheduleTimeFull},
          ${tz},
          ${target_user_ids},
          ${nextRunAtResult.next_run_at}
        )
        RETURNING *
      `;
      
      if (!campaign) {
        return { success: false, error: 'Failed to create campaign' };
      }
      
      return { success: true, campaign };
    } catch (error: any) {
      if (error?.message?.includes('unique constraint')) {
        return { success: false, error: 'A campaign with this template name already exists' };
      }
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
);
