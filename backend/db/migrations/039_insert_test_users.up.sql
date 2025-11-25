INSERT INTO users (id, email, name, password_hash, created_at, is_active, login_count, last_login)
VALUES 
  (
    'test-user-001',
    'alice.active@example.com',
    'Alice Active',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW() - INTERVAL '45 days',
    true,
    28,
    NOW() - INTERVAL '2 hours'
  ),
  (
    'test-user-002',
    'bob.frequent@example.com',
    'Bob Frequent',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW() - INTERVAL '30 days',
    true,
    42,
    NOW() - INTERVAL '1 day'
  ),
  (
    'test-user-003',
    'charlie.new@example.com',
    'Charlie New',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW() - INTERVAL '3 days',
    true,
    5,
    NOW() - INTERVAL '5 hours'
  ),
  (
    'test-user-004',
    'diana.inactive@example.com',
    'Diana Inactive',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW() - INTERVAL '60 days',
    false,
    0,
    NOW() - INTERVAL '15 days'
  ),
  (
    'test-user-005',
    'emma.moderate@example.com',
    'Emma Moderate',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW() - INTERVAL '20 days',
    true,
    15,
    NOW() - INTERVAL '3 days'
  );

INSERT INTO app_events (user_id, event_type, created_at)
SELECT 
  user_id,
  event_type,
  created_at
FROM (
  VALUES
    ('test-user-001', 'login', NOW() - INTERVAL '2 hours'),
    ('test-user-001', 'login', NOW() - INTERVAL '1 day'),
    ('test-user-001', 'login', NOW() - INTERVAL '2 days'),
    ('test-user-001', 'conversation_start', NOW() - INTERVAL '2 hours'),
    ('test-user-001', 'conversation_start', NOW() - INTERVAL '1 day'),
    ('test-user-001', 'morning_routine_start', NOW() - INTERVAL '1 day'),
    ('test-user-001', 'morning_routine_start', NOW() - INTERVAL '2 days'),
    ('test-user-001', 'feeling_check_start', NOW() - INTERVAL '3 days'),
    
    ('test-user-002', 'login', NOW() - INTERVAL '1 day'),
    ('test-user-002', 'login', NOW() - INTERVAL '2 days'),
    ('test-user-002', 'login', NOW() - INTERVAL '3 days'),
    ('test-user-002', 'login', NOW() - INTERVAL '4 days'),
    ('test-user-002', 'login', NOW() - INTERVAL '5 days'),
    ('test-user-002', 'conversation_start', NOW() - INTERVAL '1 day'),
    ('test-user-002', 'conversation_start', NOW() - INTERVAL '2 days'),
    ('test-user-002', 'conversation_start', NOW() - INTERVAL '3 days'),
    ('test-user-002', 'morning_routine_start', NOW() - INTERVAL '1 day'),
    ('test-user-002', 'morning_routine_start', NOW() - INTERVAL '2 days'),
    ('test-user-002', 'morning_routine_start', NOW() - INTERVAL '3 days'),
    ('test-user-002', 'morning_routine_start', NOW() - INTERVAL '4 days'),
    ('test-user-002', 'feeling_check_start', NOW() - INTERVAL '2 days'),
    ('test-user-002', 'feeling_check_start', NOW() - INTERVAL '5 days'),
    
    ('test-user-003', 'login', NOW() - INTERVAL '5 hours'),
    ('test-user-003', 'login', NOW() - INTERVAL '1 day'),
    ('test-user-003', 'conversation_start', NOW() - INTERVAL '5 hours'),
    ('test-user-003', 'morning_routine_start', NOW() - INTERVAL '1 day'),
    
    ('test-user-004', 'login', NOW() - INTERVAL '15 days'),
    ('test-user-004', 'conversation_start', NOW() - INTERVAL '15 days'),
    
    ('test-user-005', 'login', NOW() - INTERVAL '3 days'),
    ('test-user-005', 'login', NOW() - INTERVAL '5 days'),
    ('test-user-005', 'login', NOW() - INTERVAL '7 days'),
    ('test-user-005', 'conversation_start', NOW() - INTERVAL '3 days'),
    ('test-user-005', 'conversation_start', NOW() - INTERVAL '5 days'),
    ('test-user-005', 'morning_routine_start', NOW() - INTERVAL '4 days'),
    ('test-user-005', 'morning_routine_start', NOW() - INTERVAL '6 days'),
    ('test-user-005', 'feeling_check_start', NOW() - INTERVAL '3 days'),
    ('test-user-005', 'feeling_check_start', NOW() - INTERVAL '8 days')
) AS events(user_id, event_type, created_at);
