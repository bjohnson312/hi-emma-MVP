-- Add optional name_pronunciation column to users table
ALTER TABLE users 
ADD COLUMN name_pronunciation TEXT NULL;

COMMENT ON COLUMN users.name_pronunciation IS 'Optional phonetic spelling for TTS. Visual display uses name column.';
