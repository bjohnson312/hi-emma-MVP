UPDATE users 
SET created_at = NOW() - INTERVAL '30 days' 
WHERE created_at IS NULL;
