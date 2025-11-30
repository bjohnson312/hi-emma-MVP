CREATE TABLE care_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  condition_key TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_care_plans_user_active ON care_plans(user_id, is_active);

CREATE TABLE care_plan_items (
  id BIGSERIAL PRIMARY KEY,
  care_plan_id BIGINT NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medication', 'activity', 'measurement', 'other')),
  label TEXT NOT NULL,
  details JSONB,
  frequency TEXT NOT NULL,
  times_of_day JSONB,
  days_of_week JSONB,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_care_plan_items_plan ON care_plan_items(care_plan_id, is_active);

CREATE TABLE care_plan_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  care_plan_id BIGINT NOT NULL REFERENCES care_plans(id),
  completion_date DATE NOT NULL,
  completed_item_ids JSONB NOT NULL,
  all_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, care_plan_id, completion_date)
);

CREATE INDEX idx_care_plan_completions_user_date ON care_plan_completions(user_id, completion_date DESC);
