ALTER TABLE user_profiles
ADD COLUMN wake_time TEXT,
ADD COLUMN morning_routine_preferences JSONB DEFAULT '{}'::jsonb;

CREATE INDEX idx_user_profiles_wake_time ON user_profiles(wake_time) WHERE wake_time IS NOT NULL;

COMMENT ON COLUMN user_profiles.wake_time IS 'Preferred wake-up time in HH:MM format';
COMMENT ON COLUMN user_profiles.morning_routine_preferences IS 'JSON object containing stretching, gratitude, music genre, meditation/prayer preferences';
