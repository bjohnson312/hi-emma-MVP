CREATE TABLE saved_meal_plans (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  meal_plan_id INTEGER REFERENCES weekly_meal_plans(id),
  title TEXT NOT NULL,
  meal_plan_data JSONB NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_meal_plans_user ON saved_meal_plans(user_id);
CREATE INDEX idx_saved_meal_plans_favorite ON saved_meal_plans(user_id, is_favorite);

CREATE TABLE saved_shopping_lists (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  shopping_list_data JSONB NOT NULL,
  meal_plan_id INTEGER REFERENCES weekly_meal_plans(id),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_shopping_lists_user ON saved_shopping_lists(user_id);
CREATE INDEX idx_saved_shopping_lists_favorite ON saved_shopping_lists(user_id, is_favorite);
