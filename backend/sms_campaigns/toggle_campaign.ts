import { api } from "encore.dev/api";
import db from "../db";
import type { ToggleCampaignRequest, ToggleCampaignResponse, SMSCampaign } from "./types";

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
        const scheduleTimeStr = existingCampaign.schedule_time.toString();
        const timeMatch = scheduleTimeStr.match(/(\d{2}):(\d{2})/);
        if (timeMatch) {
          const scheduleTime = `${timeMatch[1]}:${timeMatch[2]}`;
          nextRunAt = calculateNextRunAt(scheduleTime, existingCampaign.timezone);
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
