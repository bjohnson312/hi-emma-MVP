ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS name VARCHAR(255);

UPDATE users SET is_active = true WHERE is_active IS NULL;
