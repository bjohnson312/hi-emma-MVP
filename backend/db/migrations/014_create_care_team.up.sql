CREATE TABLE care_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL CHECK (member_type IN (
    'family',
    'caretaker',
    'primary_care',
    'specialist',
    'chiropractor',
    'physical_therapist',
    'mental_health',
    'nutritionist',
    'personal_trainer',
    'dentist',
    'other'
  )),
  relationship TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  fax TEXT,
  specialty TEXT,
  organization TEXT,
  address TEXT,
  notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  email_pending BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE care_team_setup_progress (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 7,
  steps_completed TEXT[] DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_care_team_members_user ON care_team_members(user_id);
CREATE INDEX idx_care_team_members_email_pending ON care_team_members(email_pending) WHERE email_pending = true;
