CREATE TABLE IF NOT EXISTS provider_chat_sessions (
  id SERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS provider_chat_history (
  id SERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL,
  session_id INTEGER NOT NULL REFERENCES provider_chat_sessions(id),
  user_message TEXT NOT NULL,
  emma_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_provider_chat_history_provider ON provider_chat_history(provider_id);
CREATE INDEX idx_provider_chat_history_session ON provider_chat_history(session_id);
CREATE INDEX idx_provider_chat_sessions_provider ON provider_chat_sessions(provider_id);
