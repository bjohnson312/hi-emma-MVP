CREATE TABLE onboarding_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  first_name TEXT,
  reason_for_joining TEXT,
  current_feeling TEXT,
  preferred_check_in_time TEXT,
  reminder_preference TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_onboarding_user_id ON onboarding_preferences(user_id);
CREATE INDEX idx_onboarding_completed ON onboarding_preferences(onboarding_completed);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wake_time TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS voice_preference TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS morning_routine_preferences JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS wellness_goals TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS dietary_preferences JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS health_conditions TEXT[];
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS lifestyle_preferences JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS interaction_count INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP;
