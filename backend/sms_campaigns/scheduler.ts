import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import { secret } from "encore.dev/config";

const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

export const sendScheduledCampaignsHandler = api(
  { expose: false, method: "POST", path: "/internal/send-scheduled-campaigns" },
  async (): Promise<{ sent: number; skipped: number; errors: number }> => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;
    
    let sent = 0;
    let skipped = 0;
    let errors = 0;
    
    const campaigns = [];
    for await (const campaign of db.query<{
      id: number;
      name: string;
      template_name: string;
      message_body: string;
      schedule_time: string;
      target_user_ids: string[] | null;
    }>`
      SELECT id, name, template_name, message_body, schedule_time, target_user_ids
      FROM scheduled_sms_campaigns
      WHERE is_active = true
    `) {
      campaigns.push(campaign);
    }
    
    for (const campaign of campaigns) {
      const scheduleHour = parseInt(campaign.schedule_time.split(':')[0]);
      const scheduleMinute = parseInt(campaign.schedule_time.split(':')[1]);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour !== scheduleHour || Math.abs(currentMinute - scheduleMinute) > 7) {
        continue;
      }
      
      if (!campaign.target_user_ids || campaign.target_user_ids.length === 0) {
        console.warn(`Campaign ${campaign.id} has no target users, skipping`);
        skipped++;
        continue;
      }
      
      const users = [];
      for await (const user of db.query<{ id: string; phone_number: string | null }>`
        SELECT u.id, np.phone_number
        FROM users u
        LEFT JOIN notification_preferences np ON u.id = np.user_id
        WHERE u.id = ANY(${campaign.target_user_ids})
          AND np.phone_number IS NOT NULL
      `) {
        if (user.phone_number) {
          users.push({ id: user.id, phone_number: user.phone_number });
        }
      }
      
      for (const user of users) {
        try {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const alreadySent = await db.queryRow<{ count: number }>`
            SELECT COUNT(*) as count
            FROM scheduled_sms_campaign_sends
            WHERE campaign_id = ${campaign.id}
              AND user_id = ${user.id}
              AND sent_at >= ${today}
              AND sent_at < ${tomorrow}
          `;
          
          if (alreadySent && alreadySent.count > 0) {
            skipped++;
            continue;
          }
          
          let fromIdentifier: string;
          try {
            const serviceSid = twilioMessagingServiceSid();
            fromIdentifier = serviceSid || twilioPhoneNumber();
          } catch {
            fromIdentifier = twilioPhoneNumber();
          }
          
          const message = await db.queryRow<{ id: number }>`
            INSERT INTO messages (
              channel, direction, "to", "from", body, status, metadata, user_id, template_name
            ) VALUES (
              'sms',
              'outbound',
              ${user.phone_number},
              ${fromIdentifier},
              ${campaign.message_body},
              'pending',
              ${JSON.stringify({ campaign_id: campaign.id, campaign_name: campaign.name })},
              ${user.id},
              ${campaign.template_name}
            )
            RETURNING id
          `;
          
          if (!message) {
            errors++;
            continue;
          }
          
          const result = await sendSMS(user.phone_number, campaign.message_body);
          
          await db.exec`
            UPDATE messages
            SET status = 'sent', external_id = ${result.sid}
            WHERE id = ${message.id}
          `;
          
          await db.exec`
            INSERT INTO scheduled_sms_campaign_sends (
              campaign_id, user_id, phone_number, message_id, status
            ) VALUES (
              ${campaign.id},
              ${user.id},
              ${user.phone_number},
              ${message.id},
              'sent'
            )
          `;
          
          sent++;
          
        } catch (error: any) {
          console.error(`Failed to send campaign ${campaign.id} to user ${user.id}:`, error);
          errors++;
        }
      }
    }
    
    return { sent, skipped, errors };
  }
);

const sendScheduledCampaigns = new CronJob(
  "send-scheduled-sms-campaigns",
  {
    title: "Send Scheduled SMS Campaigns",
    every: "15m",
    endpoint: sendScheduledCampaignsHandler,
  }
);
