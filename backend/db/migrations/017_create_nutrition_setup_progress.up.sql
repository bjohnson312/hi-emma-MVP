CREATE TABLE IF NOT EXISTS nutrition_setup_progress (
  user_id TEXT PRIMARY KEY,
  current_step INTEGER DEFAULT 0,
  steps_completed TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
