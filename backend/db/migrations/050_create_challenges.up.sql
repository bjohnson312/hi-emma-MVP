CREATE TABLE IF NOT EXISTS challenges (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  name TEXT NOT NULL,
  description TEXT,

  day_messages JSONB NOT NULL DEFAULT '[]',

  send_time TIME NOT NULL DEFAULT '09:00:00',
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_by TEXT
);

CREATE TABLE IF NOT EXISTS challenge_enrollments (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,

  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_day INT NOT NULL DEFAULT 0,

  is_active BOOLEAN NOT NULL DEFAULT true,

  UNIQUE (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenge_sends (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  enrollment_id BIGINT NOT NULL REFERENCES challenge_enrollments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,

  day_number INT NOT NULL,
  message_body TEXT NOT NULL,

  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id BIGINT REFERENCES messages(id),
  external_id TEXT,

  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error TEXT,

  replied_at TIMESTAMPTZ,
  reply_body TEXT,
  reply_message_id BIGINT REFERENCES messages(id),

  UNIQUE (enrollment_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_challenge ON challenge_enrollments(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_user ON challenge_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_sends_enrollment ON challenge_sends(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_challenge_sends_phone ON challenge_sends(phone_number);
CREATE INDEX IF NOT EXISTS idx_challenge_sends_replied ON challenge_sends(replied_at) WHERE replied_at IS NOT NULL;
