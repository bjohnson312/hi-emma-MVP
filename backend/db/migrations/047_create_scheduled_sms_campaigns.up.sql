CREATE TABLE scheduled_sms_campaigns (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  name TEXT NOT NULL,
  template_name TEXT NOT NULL UNIQUE,
  message_body TEXT NOT NULL,
  
  schedule_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  target_user_ids TEXT[],
  
  created_by TEXT
);

CREATE TABLE scheduled_sms_campaign_sends (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES scheduled_sms_campaigns(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id BIGINT REFERENCES messages(id),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error TEXT
);

CREATE INDEX idx_campaigns_active ON scheduled_sms_campaigns(is_active) WHERE is_active = true;
CREATE INDEX idx_campaign_sends_lookup ON scheduled_sms_campaign_sends(campaign_id, user_id, DATE(sent_at));
