CREATE TABLE conversation_memory (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  context TEXT,
  first_mentioned TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_mentioned TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  mention_count INTEGER NOT NULL DEFAULT 1,
  importance_score INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category, key)
);

CREATE INDEX idx_conversation_memory_user_id ON conversation_memory(user_id);
CREATE INDEX idx_conversation_memory_category ON conversation_memory(category);
CREATE INDEX idx_conversation_memory_last_mentioned ON conversation_memory(last_mentioned DESC);
CREATE INDEX idx_conversation_memory_importance ON conversation_memory(importance_score DESC);
