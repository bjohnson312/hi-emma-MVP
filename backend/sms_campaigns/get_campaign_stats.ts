import { api } from "encore.dev/api";
import db from "../db";
import type { GetCampaignStatsRequest, GetCampaignStatsResponse, CampaignStats } from "./types";

export const getCampaignStats = api(
  { expose: true, method: "POST", path: "/sms-campaigns/stats", auth: false },
  async (req: GetCampaignStatsRequest): Promise<GetCampaignStatsResponse> => {
    const { id } = req;
    
    const campaign = await db.queryRow<{ name: string }>`
      SELECT name FROM scheduled_sms_campaigns WHERE id = ${id}
    `;
    
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    
    const totalSends = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM scheduled_sms_campaign_sends
      WHERE campaign_id = ${id}
    `;
    
    const sendsToday = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM scheduled_sms_campaign_sends
      WHERE campaign_id = ${id} AND DATE(sent_at) = CURRENT_DATE
    `;
    
    const lastSent = await db.queryRow<{ sent_at: Date }>`
      SELECT sent_at
      FROM scheduled_sms_campaign_sends
      WHERE campaign_id = ${id}
      ORDER BY sent_at DESC
      LIMIT 1
    `;
    
    const recentSends = [];
    for await (const send of db.query<{
      user_id: string;
      phone_number: string;
      sent_at: Date;
      status: string;
    }>`
      SELECT user_id, phone_number, sent_at, status
      FROM scheduled_sms_campaign_sends
      WHERE campaign_id = ${id}
      ORDER BY sent_at DESC
      LIMIT 20
    `) {
      recentSends.push(send);
    }
    
    const stats: CampaignStats = {
      campaign_id: id,
      campaign_name: campaign.name,
      total_sends: totalSends?.count || 0,
      sends_today: sendsToday?.count || 0,
      last_sent_at: lastSent?.sent_at,
      recent_sends: recentSends
    };
    
    return { stats };
  }
);
