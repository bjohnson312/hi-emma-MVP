CREATE TABLE IF NOT EXISTS client_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  error_type VARCHAR(50) NOT NULL,
  component_name VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  api_endpoint TEXT,
  http_status_code INTEGER,
  user_agent TEXT,
  browser_info JSONB,
  session_id TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  resolved BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_errors_user_id ON client_errors(user_id);
CREATE INDEX idx_client_errors_created_at ON client_errors(created_at DESC);
CREATE INDEX idx_client_errors_severity ON client_errors(severity);
CREATE INDEX idx_client_errors_resolved ON client_errors(resolved);
CREATE INDEX idx_client_errors_type ON client_errors(error_type);
CREATE INDEX idx_client_errors_component ON client_errors(component_name);
