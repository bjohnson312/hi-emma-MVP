CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
