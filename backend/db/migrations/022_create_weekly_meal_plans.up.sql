CREATE TABLE weekly_meal_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  plan_data JSONB NOT NULL,
  shopping_list JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

CREATE INDEX idx_weekly_meal_plans_user_id ON weekly_meal_plans(user_id);
CREATE INDEX idx_weekly_meal_plans_active ON weekly_meal_plans(user_id, active, week_start_date DESC);

COMMENT ON TABLE weekly_meal_plans IS 'Stores weekly meal plans with 3 meals + snacks per day';
COMMENT ON COLUMN weekly_meal_plans.plan_data IS 'JSON structure: {monday: {breakfast: {...}, lunch: {...}, dinner: {...}, snacks: [...]}, ...}';
COMMENT ON COLUMN weekly_meal_plans.shopping_list IS 'Auto-generated shopping list grouped by category';
