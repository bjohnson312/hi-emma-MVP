CREATE TABLE IF NOT EXISTS nutrition_daily_achievements (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  calorie_percentage DECIMAL,
  protein_percentage DECIMAL,
  carbs_percentage DECIMAL,
  fat_percentage DECIMAL,
  water_percentage DECIMAL,
  overall_percentage DECIMAL,
  goals_met INTEGER DEFAULT 0,
  total_goals INTEGER DEFAULT 5,
  achieved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_achievements_user_date 
  ON nutrition_daily_achievements(user_id, date DESC);
