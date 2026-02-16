export interface SMSCampaign {
  id: number;
  created_at: Date;
  updated_at: Date;
  name: string;
  template_name: string;
  message_body: string;
  schedule_time: string;
  timezone: string;
  is_active: boolean;
  target_user_ids?: string[] | null;
  created_by?: string | null;
  next_run_at?: Date | null;
}

export interface CreateCampaignRequest {
  name: string;
  template_name: string;
  message_body: string;
  schedule_time: string;
  timezone?: string;
  target_user_ids?: string[];
}

export interface CreateCampaignResponse {
  success: boolean;
  campaign?: SMSCampaign;
  error?: string;
}

export interface ListCampaignsResponse {
  campaigns: SMSCampaign[];
  total: number;
}

export interface UpdateCampaignRequest {
  id: number;
  name?: string;
  message_body?: string;
  schedule_time?: string;
  is_active?: boolean;
  target_user_ids?: string[];
}

export interface UpdateCampaignResponse {
  success: boolean;
  campaign?: SMSCampaign;
  error?: string;
}

export interface DeleteCampaignRequest {
  id: number;
}

export interface DeleteCampaignResponse {
  success: boolean;
  error?: string;
}

export interface ToggleCampaignRequest {
  id: number;
  is_active: boolean;
}

export interface ToggleCampaignResponse {
  success: boolean;
  campaign?: SMSCampaign;
  error?: string;
}

export interface CampaignStats {
  campaign_id: number;
  campaign_name: string;
  total_sends: number;
  sends_today: number;
  last_sent_at?: Date | null;
  recent_sends: {
    user_id: string;
    phone_number: string;
    sent_at: Date;
    status: string;
  }[];
}

export interface GetCampaignStatsRequest {
  id: number;
}

export interface GetCampaignStatsResponse {
  stats: CampaignStats;
}
