import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateCampaignRequest, UpdateCampaignResponse, SMSCampaign } from "./types";

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

export const updateCampaign = api(
  { expose: true, method: "POST", path: "/sms-campaigns/update", auth: false },
  async (req: UpdateCampaignRequest): Promise<UpdateCampaignResponse> => {
    const { id, name, message_body, schedule_time, is_active, target_user_ids } = req;
    
    if (name === undefined && message_body === undefined && schedule_time === undefined && is_active === undefined && target_user_ids === undefined) {
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
        const nextRunAt = calculateNextRunAt(schedule_time, campaign.timezone);
        await db.exec`
          UPDATE scheduled_sms_campaigns 
          SET next_run_at = ${nextRunAt}, updated_at = NOW() 
          WHERE id = ${id}
        `;
        campaign.next_run_at = nextRunAt;
      }
      
      return { success: true, campaign };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
);
