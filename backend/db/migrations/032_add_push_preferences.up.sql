ALTER TABLE notification_preferences 
ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;
