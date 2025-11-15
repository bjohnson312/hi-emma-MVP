CREATE TABLE conversation_detected_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id VARCHAR NOT NULL,
  intent_type VARCHAR NOT NULL,
  extracted_data JSONB NOT NULL,
  confidence FLOAT NOT NULL,
  emma_suggestion_text TEXT,
  status VARCHAR NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

CREATE INDEX idx_insights_session ON conversation_detected_insights(session_id);
CREATE INDEX idx_insights_user_status ON conversation_detected_insights(user_id, status);
CREATE INDEX idx_insights_created ON conversation_detected_insights(created_at DESC);
