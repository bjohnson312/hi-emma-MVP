CREATE TABLE IF NOT EXISTS admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_action_logs(created_at);
CREATE INDEX idx_admin_logs_target_user ON admin_action_logs(target_user_id);
