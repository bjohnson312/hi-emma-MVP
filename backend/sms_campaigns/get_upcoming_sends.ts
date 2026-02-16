import { api } from "encore.dev/api";
import db from "../db";
import type { UpcomingSend, GetUpcomingSendsResponse } from "./types";

export const getUpcomingSends = api(
  { expose: true, method: "GET", path: "/sms-campaigns/upcoming-sends", auth: false },
  async (): Promise<GetUpcomingSendsResponse> => {
    const upcomingSends: UpcomingSend[] = [];
    
    for await (const row of db.query<{
      id: number;
      name: string;
      message_body: string;
      next_run_at: Date;
      target_user_ids: string[] | null;
    }>`
      SELECT 
        id,
        name,
        message_body,
        next_run_at,
        target_user_ids
      FROM scheduled_sms_campaigns
      WHERE is_active = true 
        AND next_run_at IS NOT NULL
        AND next_run_at > NOW()
      ORDER BY next_run_at ASC
      LIMIT 10
    `) {
      let estimatedRecipients = 0;
      
      if (row.target_user_ids && row.target_user_ids.length > 0) {
        const countResult = await db.queryRow<{ count: number }>`
          SELECT COUNT(*) as count
          FROM users
          WHERE clerk_user_id = ANY(${row.target_user_ids}::text[])
            AND phone_number IS NOT NULL
        `;
        estimatedRecipients = countResult?.count || 0;
      } else {
        const countResult = await db.queryRow<{ count: number }>`
          SELECT COUNT(*) as count
          FROM users
          WHERE phone_number IS NOT NULL
        `;
        estimatedRecipients = countResult?.count || 0;
      }
      
      const now = new Date();
      const timeUntilSend = row.next_run_at.getTime() - now.getTime();
      const hoursUntilSend = Math.floor(timeUntilSend / (1000 * 60 * 60));
      const minutesUntilSend = Math.floor((timeUntilSend % (1000 * 60 * 60)) / (1000 * 60));
      
      let timeUntilSendFormatted: string;
      if (hoursUntilSend >= 24) {
        const days = Math.floor(hoursUntilSend / 24);
        timeUntilSendFormatted = `in ${days} day${days > 1 ? 's' : ''}`;
      } else if (hoursUntilSend > 0) {
        timeUntilSendFormatted = `in ${hoursUntilSend}h ${minutesUntilSend}m`;
      } else {
        timeUntilSendFormatted = `in ${minutesUntilSend} minute${minutesUntilSend !== 1 ? 's' : ''}`;
      }
      
      upcomingSends.push({
        id: row.id,
        name: row.name,
        message_body: row.message_body,
        next_run_at: row.next_run_at,
        estimated_recipients: estimatedRecipients,
        time_until_send: timeUntilSendFormatted,
        target_group: row.target_user_ids && row.target_user_ids.length > 0 ? 'Specific Users' : 'All Users',
      });
    }
    
    return { upcoming_sends: upcomingSends };
  }
);
