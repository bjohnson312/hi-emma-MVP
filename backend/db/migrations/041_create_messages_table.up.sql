CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push', 'browser')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  
  "to" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  
  body TEXT NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'received')),
  error TEXT,
  
  external_id TEXT,
  
  metadata JSONB DEFAULT '{}',
  
  user_id TEXT,
  
  template_name TEXT,
  
  CONSTRAINT messages_external_id_unique UNIQUE (external_id)
);

CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_channel_direction ON messages(channel, direction);
CREATE INDEX idx_messages_user_id ON messages(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_messages_external_id ON messages(external_id) WHERE external_id IS NOT NULL;
