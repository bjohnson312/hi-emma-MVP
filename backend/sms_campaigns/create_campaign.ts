import { api } from "encore.dev/api";
import db from "../db";
import type { CreateCampaignRequest, CreateCampaignResponse, SMSCampaign } from "./types";

function calculateNextRunAt(scheduleTime: string, timezone: string): Date {
  const now = new Date();
  
  const todayInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  
  const scheduledToday = new Date(todayInTz);
  scheduledToday.setHours(hours, minutes, 0, 0);
  
  const scheduledTodayUTC = new Date(scheduledToday.toLocaleString('en-US', { timeZone: 'UTC' }));
  const scheduledTodayLocal = new Date(scheduledToday.toLocaleString('en-US', { timeZone: timezone }));
  const offset = scheduledTodayUTC.getTime() - scheduledTodayLocal.getTime();
  const scheduledTodayActual = new Date(scheduledToday.getTime() - offset);
  
  if (scheduledTodayActual > now) {
    return scheduledTodayActual;
  } else {
    const scheduledTomorrow = new Date(scheduledTodayActual);
    scheduledTomorrow.setDate(scheduledTomorrow.getDate() + 1);
    return scheduledTomorrow;
  }
}

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
    
    const nextRunAt = calculateNextRunAt(schedule_time, tz);
    
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
          ${nextRunAt}
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
