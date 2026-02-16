import { api } from "encore.dev/api";
import db from "../db";
import type { ListCampaignsResponse, SMSCampaign } from "./types";

export const listCampaigns = api(
  { expose: true, method: "GET", path: "/sms-campaigns/list", auth: false },
  async (): Promise<ListCampaignsResponse> => {
    const campaigns: SMSCampaign[] = [];
    
    for await (const campaign of db.query<SMSCampaign>`
      SELECT * FROM scheduled_sms_campaigns
      ORDER BY created_at DESC
    `) {
      campaigns.push(campaign);
    }
    
    return { campaigns, total: campaigns.length };
  }
);
