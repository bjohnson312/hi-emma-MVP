CREATE TABLE wellness_journal_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('daily_summary', 'milestone', 'insight', 'event')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  sleep_quality TEXT,
  tags TEXT[],
  metadata JSONB,
  source_type TEXT,
  source_id BIGINT,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wellness_journal_user_date ON wellness_journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_wellness_journal_type ON wellness_journal_entries(user_id, entry_type);
CREATE INDEX idx_wellness_journal_tags ON wellness_journal_entries USING GIN(tags);
CREATE INDEX idx_wellness_journal_created ON wellness_journal_entries(user_id, created_at DESC);
