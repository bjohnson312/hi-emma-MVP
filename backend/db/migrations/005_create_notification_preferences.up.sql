CREATE TABLE notification_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  morning_checkin_enabled BOOLEAN NOT NULL DEFAULT true,
  morning_checkin_time TIME NOT NULL DEFAULT '07:00:00',
  medication_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  evening_reflection_enabled BOOLEAN NOT NULL DEFAULT false,
  evening_reflection_time TIME NOT NULL DEFAULT '21:00:00',
  notification_method TEXT NOT NULL DEFAULT 'browser' CHECK (notification_method IN ('browser', 'sms', 'both')),
  phone_number TEXT,
  push_subscription JSONB,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_time TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('browser', 'sms')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_time, status);
CREATE INDEX idx_notification_queue_user ON notification_queue(user_id, created_at DESC);
