ALTER TABLE user_profiles
ADD COLUMN timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN interaction_count INTEGER DEFAULT 0,
ADD COLUMN last_interaction_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN wellness_goals JSONB DEFAULT '[]'::jsonb,
ADD COLUMN dietary_preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN health_conditions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN lifestyle_preferences JSONB DEFAULT '{}'::jsonb,
ADD COLUMN voice_preference TEXT,
ADD COLUMN notification_preferences JSONB DEFAULT '{}'::jsonb;

CREATE TABLE user_behavior_patterns (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(3, 2) DEFAULT 0.5,
  first_observed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_observed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  observation_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pattern_type)
);

CREATE TABLE user_insights (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  insight_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendations JSONB DEFAULT '[]'::jsonb,
  data_points JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_milestones (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_behavior_patterns_user_id ON user_behavior_patterns(user_id);
CREATE INDEX idx_user_behavior_patterns_type ON user_behavior_patterns(pattern_type);
CREATE INDEX idx_user_behavior_patterns_confidence ON user_behavior_patterns(confidence_score DESC);
CREATE INDEX idx_user_insights_user_id ON user_insights(user_id);
CREATE INDEX idx_user_insights_type ON user_insights(insight_type);
CREATE INDEX idx_user_insights_generated_at ON user_insights(generated_at DESC);
CREATE INDEX idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_achieved_at ON user_milestones(achieved_at DESC);

COMMENT ON COLUMN user_profiles.wellness_goals IS 'Array of user wellness goals like "better sleep", "reduce stress", "healthier eating"';
COMMENT ON COLUMN user_profiles.dietary_preferences IS 'Dietary restrictions, allergies, preferences';
COMMENT ON COLUMN user_profiles.health_conditions IS 'Conditions user has mentioned to personalize support';
COMMENT ON COLUMN user_profiles.lifestyle_preferences IS 'Exercise habits, work schedule, hobbies, etc.';
COMMENT ON TABLE user_behavior_patterns IS 'Tracks learned patterns like typical wake time, preferred activities, etc.';
COMMENT ON TABLE user_insights IS 'Personalized insights generated from user data';
COMMENT ON TABLE user_milestones IS 'Achievements and milestones to celebrate user progress';
