CREATE TABLE export_shares (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  recipient_name TEXT,
  recipient_email TEXT,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  included_categories TEXT[] NOT NULL,
  include_conversations BOOLEAN NOT NULL DEFAULT FALSE,
  format TEXT NOT NULL CHECK (format IN ('json', 'pdf')),
  expires_at TIMESTAMP NOT NULL,
  access_count INTEGER NOT NULL DEFAULT 0,
  max_access_count INTEGER DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMP
);

CREATE INDEX idx_export_shares_token ON export_shares(share_token) WHERE active = TRUE;
CREATE INDEX idx_export_shares_user ON export_shares(user_id, created_at DESC);
CREATE INDEX idx_export_shares_expiration ON export_shares(expires_at) WHERE active = TRUE;
