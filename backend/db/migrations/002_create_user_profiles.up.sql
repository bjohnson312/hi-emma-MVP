CREATE TABLE user_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('morning', 'evening', 'mood', 'diet', 'doctors_orders', 'general')),
  user_message TEXT,
  emma_response TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_user_type ON conversation_history(user_id, conversation_type, created_at DESC);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
