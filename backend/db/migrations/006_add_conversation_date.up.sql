ALTER TABLE conversation_sessions ADD COLUMN conversation_date DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE INDEX idx_conversation_sessions_date ON conversation_sessions(user_id, session_type, conversation_date DESC);
