ALTER TABLE conversation_history
DROP CONSTRAINT conversation_history_conversation_type_check;

ALTER TABLE conversation_history
ADD CONSTRAINT conversation_history_conversation_type_check 
CHECK (conversation_type IN ('morning', 'evening', 'mood', 'diet', 'nutrition', 'doctors_orders', 'general'));
