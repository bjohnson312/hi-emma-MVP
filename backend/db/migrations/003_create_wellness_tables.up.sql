CREATE TABLE evening_routine_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  wind_down_activities TEXT[],
  screen_time_minutes INTEGER,
  dinner_time TIME,
  bedtime TIME,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE doctors_orders (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  time_of_day TEXT[],
  start_date DATE NOT NULL,
  end_date DATE,
  prescribing_doctor TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE medication_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  doctors_order_id BIGINT REFERENCES doctors_orders(id),
  taken_at TIMESTAMP NOT NULL DEFAULT NOW(),
  scheduled_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE diet_nutrition_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_time TIME,
  description TEXT NOT NULL,
  water_intake_oz INTEGER,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE mood_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  mood_rating INTEGER NOT NULL CHECK (mood_rating BETWEEN 1 AND 10),
  mood_tags TEXT[],
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  notes TEXT,
  triggers TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evening_routine_user_date ON evening_routine_logs(user_id, date DESC);
CREATE INDEX idx_doctors_orders_user_active ON doctors_orders(user_id, active);
CREATE INDEX idx_medication_logs_user_date ON medication_logs(user_id, taken_at DESC);
CREATE INDEX idx_diet_nutrition_user_date ON diet_nutrition_logs(user_id, date DESC);
CREATE INDEX idx_mood_logs_user_date ON mood_logs(user_id, date DESC);
