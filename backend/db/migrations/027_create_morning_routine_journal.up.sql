CREATE TABLE morning_routine_journal (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  entry_text TEXT NOT NULL,
  activity_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_morning_journal_user_date ON morning_routine_journal(user_id, created_at DESC);
CREATE INDEX idx_morning_journal_type ON morning_routine_journal(user_id, entry_type, created_at DESC);

COMMENT ON TABLE morning_routine_journal IS 'Timestamped journal of all morning routine events';
COMMENT ON COLUMN morning_routine_journal.entry_type IS 'Type of event: activity_added, activity_completed, routine_created, routine_edited, routine_selected';
COMMENT ON COLUMN morning_routine_journal.entry_text IS 'Human-readable description of the event';
COMMENT ON COLUMN morning_routine_journal.activity_name IS 'Name of activity if applicable';
COMMENT ON COLUMN morning_routine_journal.metadata IS 'Additional context about the event';
