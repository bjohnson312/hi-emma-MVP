CREATE TABLE wellness_journey_setup (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  wellness_journal_setup BOOLEAN NOT NULL DEFAULT FALSE,
  wellness_journal_chapter_created BOOLEAN NOT NULL DEFAULT FALSE,
  morning_routine_completed BOOLEAN NOT NULL DEFAULT FALSE,
  evening_routine_completed BOOLEAN NOT NULL DEFAULT FALSE,
  diet_nutrition_setup BOOLEAN NOT NULL DEFAULT FALSE,
  doctors_orders_added BOOLEAN NOT NULL DEFAULT FALSE,
  care_team_added BOOLEAN NOT NULL DEFAULT FALSE,
  notifications_configured BOOLEAN NOT NULL DEFAULT FALSE,
  user_profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  first_conversation BOOLEAN NOT NULL DEFAULT FALSE,
  setup_started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  setup_completed_at TIMESTAMP,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wellness_milestones (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  milestone_type TEXT NOT NULL,
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  badge_icon TEXT,
  badge_color TEXT,
  earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_journey_setup_user ON wellness_journey_setup(user_id);
CREATE INDEX idx_milestones_user ON wellness_milestones(user_id, earned_at DESC);
CREATE INDEX idx_milestones_type ON wellness_milestones(user_id, milestone_type);
