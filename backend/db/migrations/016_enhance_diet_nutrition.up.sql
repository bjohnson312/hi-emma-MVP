ALTER TABLE diet_nutrition_logs
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS calories DECIMAL,
ADD COLUMN IF NOT EXISTS protein_g DECIMAL,
ADD COLUMN IF NOT EXISTS carbs_g DECIMAL,
ADD COLUMN IF NOT EXISTS fat_g DECIMAL,
ADD COLUMN IF NOT EXISTS fiber_g DECIMAL,
ADD COLUMN IF NOT EXISTS analyzed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS nutrition_plans (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  goals TEXT[],
  dietary_preferences TEXT,
  calorie_target INTEGER,
  protein_target_g INTEGER,
  carbs_target_g INTEGER,
  fat_target_g INTEGER,
  meal_suggestions JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refrigerator_scans (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  detected_items TEXT[],
  suggested_meals JSONB,
  scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_history JSONB,
  preferences_extracted JSONB,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
