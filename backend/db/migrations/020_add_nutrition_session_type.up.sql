ALTER TABLE conversation_sessions
DROP CONSTRAINT conversation_sessions_session_type_check;

ALTER TABLE conversation_sessions
ADD CONSTRAINT conversation_sessions_session_type_check 
CHECK (session_type IN ('morning', 'evening', 'mood', 'diet', 'nutrition', 'doctors_orders', 'general'));
