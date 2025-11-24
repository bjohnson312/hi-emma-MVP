CREATE TABLE IF NOT EXISTS app_events (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_events_created_at ON app_events(created_at DESC);
CREATE INDEX idx_app_events_user_id ON app_events(user_id);
CREATE INDEX idx_app_events_type ON app_events(event_type);
