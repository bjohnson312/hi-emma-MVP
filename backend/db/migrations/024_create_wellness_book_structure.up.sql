CREATE TABLE wellness_journal_chapters (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  motivation TEXT,
  target_outcome TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completion_vision TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wellness_journal_sections (
  id BIGSERIAL PRIMARY KEY,
  chapter_id BIGINT NOT NULL REFERENCES wellness_journal_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  habit_type TEXT,
  tracking_frequency TEXT CHECK (tracking_frequency IN ('daily', 'weekly', 'as_needed')),
  target_count INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE wellness_journal_section_logs (
  id BIGSERIAL PRIMARY KEY,
  section_id BIGINT NOT NULL REFERENCES wellness_journal_sections(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE wellness_journal_entries
ADD COLUMN chapter_id BIGINT REFERENCES wellness_journal_chapters(id) ON DELETE SET NULL,
ADD COLUMN section_id BIGINT REFERENCES wellness_journal_sections(id) ON DELETE SET NULL;

CREATE INDEX idx_chapters_user ON wellness_journal_chapters(user_id, is_active);
CREATE INDEX idx_chapters_active ON wellness_journal_chapters(user_id, is_active, created_at DESC);
CREATE INDEX idx_sections_chapter ON wellness_journal_sections(chapter_id, order_index);
CREATE INDEX idx_section_logs_section ON wellness_journal_section_logs(section_id, log_date DESC);
CREATE INDEX idx_section_logs_user ON wellness_journal_section_logs(user_id, log_date DESC);
CREATE INDEX idx_entries_chapter ON wellness_journal_entries(chapter_id, entry_date DESC);
CREATE INDEX idx_entries_section ON wellness_journal_entries(section_id, entry_date DESC);
