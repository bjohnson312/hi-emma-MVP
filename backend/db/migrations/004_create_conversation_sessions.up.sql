CREATE TABLE conversation_sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('morning', 'evening', 'mood', 'diet', 'doctors_orders', 'general')),
  current_step TEXT,
  context JSONB,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_conversation_sessions_user_active ON conversation_sessions(user_id, completed, last_activity_at DESC);
CREATE INDEX idx_conversation_sessions_type ON conversation_sessions(user_id, session_type, completed);
