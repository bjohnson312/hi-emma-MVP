ALTER TABLE scheduled_sms_campaigns 
ADD COLUMN next_run_at TIMESTAMPTZ;

CREATE INDEX idx_campaigns_next_run 
ON scheduled_sms_campaigns(next_run_at) 
WHERE is_active = true AND next_run_at IS NOT NULL;

UPDATE scheduled_sms_campaigns
SET next_run_at = (
  CASE 
    WHEN (CURRENT_DATE + schedule_time) AT TIME ZONE timezone > NOW()
    THEN (CURRENT_DATE + schedule_time) AT TIME ZONE timezone
    ELSE ((CURRENT_DATE + INTERVAL '1 day') + schedule_time) AT TIME ZONE timezone
  END
)
WHERE is_active = true AND next_run_at IS NULL;
