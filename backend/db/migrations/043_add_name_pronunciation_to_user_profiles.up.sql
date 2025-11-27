ALTER TABLE user_profiles 
ADD COLUMN name_pronunciation TEXT NULL;

COMMENT ON COLUMN user_profiles.name_pronunciation IS 'Optional phonetic spelling for TTS. Visual display uses name column.';
