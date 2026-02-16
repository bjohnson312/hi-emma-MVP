CREATE TABLE IF NOT EXISTS admin_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_settings (key, value) VALUES ('auto_send_sms_campaigns', 'true')
ON CONFLICT (key) DO NOTHING;
