CREATE TABLE morning_routine_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  routine_name TEXT,
  activities JSONB NOT NULL DEFAULT '[]',
  wake_time TEXT,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE morning_routine_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  activities_completed JSONB NOT NULL DEFAULT '[]',
  all_completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, completion_date)
);

CREATE INDEX idx_routine_preferences_user ON morning_routine_preferences(user_id);
CREATE INDEX idx_routine_completions_user_date ON morning_routine_completions(user_id, completion_date DESC);
CREATE INDEX idx_routine_completions_all ON morning_routine_completions(user_id, all_completed, completion_date DESC);
