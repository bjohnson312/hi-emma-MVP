CREATE TABLE IF NOT EXISTS diet_preferences (
  user_id TEXT PRIMARY KEY,
  dietary_restrictions TEXT[],
  allergies TEXT[],
  meal_goals TEXT[],
  water_goal_oz INTEGER DEFAULT 80,
  preferred_meal_times TEXT,
  food_as_health_enrolled BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
