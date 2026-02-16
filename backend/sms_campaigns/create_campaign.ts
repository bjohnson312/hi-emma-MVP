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
    
    try {
      const campaign = await db.queryRow<SMSCampaign>`
        INSERT INTO scheduled_sms_campaigns (
          name, template_name, message_body, schedule_time, timezone, target_user_ids
        ) VALUES (
          ${name},
          ${template_name},
          ${message_body},
          ${scheduleTimeFull},
          ${timezone || 'America/New_York'},
          ${target_user_ids}
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
