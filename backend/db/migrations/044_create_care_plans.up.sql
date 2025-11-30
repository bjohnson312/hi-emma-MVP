CREATE TABLE care_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE care_plan_tasks (
  id BIGSERIAL PRIMARY KEY,
  care_plan_id BIGINT NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('medication', 'activity', 'measurement', 'habit')),
  frequency TEXT NOT NULL,
  time_of_day TEXT,
  reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE care_plan_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id BIGINT NOT NULL REFERENCES care_plan_tasks(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_id, completion_date)
);

CREATE INDEX idx_care_plans_user ON care_plans(user_id);
CREATE INDEX idx_care_plans_active ON care_plans(user_id, is_active);
CREATE INDEX idx_care_plan_tasks_plan ON care_plan_tasks(care_plan_id);
CREATE INDEX idx_care_plan_completions_user_date ON care_plan_completions(user_id, completion_date DESC);
CREATE INDEX idx_care_plan_completions_task ON care_plan_completions(task_id, completion_date DESC);
