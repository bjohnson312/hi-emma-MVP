CREATE TABLE morning_routine_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  sleep_quality TEXT NOT NULL CHECK (sleep_quality IN ('good', 'okay', 'poor')),
  selected_action TEXT NOT NULL CHECK (selected_action IN ('stretch', 'deep_breath', 'gratitude_moment')),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_morning_routine_user_date ON morning_routine_logs(user_id, date);
