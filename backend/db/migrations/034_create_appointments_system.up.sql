CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  reason TEXT,
  location TEXT,
  care_team_role TEXT,
  risk_level TEXT DEFAULT 'low',
  pre_visit_summary_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE appointment_notes (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  note_type TEXT NOT NULL,
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  quick_note TEXT,
  template_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE appointment_summaries (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL,
  medication_adherence JSONB,
  symptom_patterns JSONB,
  mood_trends JSONB,
  diet_logs JSONB,
  routine_completion JSONB,
  clinical_risks JSONB,
  emma_alerts JSONB,
  key_insights TEXT[],
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE appointment_actions (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE provider_summary_preferences (
  id SERIAL PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,
  default_summary_type TEXT DEFAULT 'standard',
  data_fields JSONB DEFAULT '[]'::jsonb,
  lookback_days INTEGER DEFAULT 7,
  alert_thresholds JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE patient_timeline_events (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_data JSONB NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointment_notes_appointment ON appointment_notes(appointment_id);
CREATE INDEX idx_appointment_summaries_appointment ON appointment_summaries(appointment_id);
CREATE INDEX idx_appointment_summaries_type ON appointment_summaries(summary_type);
CREATE INDEX idx_appointment_actions_appointment ON appointment_actions(appointment_id);
CREATE INDEX idx_appointment_actions_status ON appointment_actions(status);
CREATE INDEX idx_patient_timeline_patient ON patient_timeline_events(patient_id);
CREATE INDEX idx_patient_timeline_date ON patient_timeline_events(event_date);
CREATE INDEX idx_patient_timeline_type ON patient_timeline_events(event_type);
