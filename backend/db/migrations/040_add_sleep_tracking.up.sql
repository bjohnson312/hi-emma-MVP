-- Add sleep tracking columns to morning_routine_completions
ALTER TABLE morning_routine_completions 
ADD COLUMN sleep_quality_label TEXT CHECK (sleep_quality_label IN ('poor', 'fair', 'good', 'great', 'excellent')),
ADD COLUMN sleep_duration_hours NUMERIC(3,1) CHECK (sleep_duration_hours >= 0 AND sleep_duration_hours <= 24);

-- Add sleep tracking columns to morning_routine_logs for historical tracking
ALTER TABLE morning_routine_logs
ADD COLUMN sleep_quality_label TEXT CHECK (sleep_quality_label IN ('poor', 'fair', 'good', 'great', 'excellent')),
ADD COLUMN sleep_duration_hours NUMERIC(3,1) CHECK (sleep_duration_hours >= 0 AND sleep_duration_hours <= 24);
