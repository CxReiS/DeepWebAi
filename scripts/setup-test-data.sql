-- Test data setup for feature flags
-- Run this to create test feature flags in your database

-- Clear existing test data
DELETE FROM feature_flag_analytics WHERE feature_flag_id IN (
  SELECT id FROM feature_flags WHERE name LIKE 'test-%' OR name IN (
    'new-chat-ui', 'ai-streaming', 'premium-models', 'file-upload', 
    'realtime-collaboration', 'advanced-analytics', 'beta-features', 'custom-themes'
  )
);

DELETE FROM user_feature_flags WHERE feature_flag_id IN (
  SELECT id FROM feature_flags WHERE name LIKE 'test-%' OR name IN (
    'new-chat-ui', 'ai-streaming', 'premium-models', 'file-upload', 
    'realtime-collaboration', 'advanced-analytics', 'beta-features', 'custom-themes'
  )
);

DELETE FROM feature_flags WHERE name LIKE 'test-%' OR name IN (
  'new-chat-ui', 'ai-streaming', 'premium-models', 'file-upload', 
  'realtime-collaboration', 'advanced-analytics', 'beta-features', 'custom-themes'
);

-- Create predefined feature flags
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage, environment) VALUES
('new-chat-ui', 'New chat interface with improved UX', true, 100, 'all'),
('ai-streaming', 'Real-time AI response streaming', true, 75, 'all'),
('premium-models', 'Access to premium AI models (GPT-4, Claude, etc.)', true, 50, 'all'),
('file-upload', 'File upload and processing functionality', true, 25, 'all'),
('realtime-collaboration', 'Real-time collaboration features', false, 10, 'development'),
('advanced-analytics', 'Advanced analytics and reporting', true, 80, 'all'),
('beta-features', 'Access to beta features', false, 5, 'development'),
('custom-themes', 'Custom theme support', true, 90, 'all');

-- Create test users if they don't exist
INSERT INTO users (id, email, created_at) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'admin@example.com', NOW()),
('456e7890-e89b-12d3-a456-426614174000', 'user@example.com', NOW()),
('789e1234-e89b-12d3-a456-426614174000', 'beta@example.com', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create user-specific overrides for testing
INSERT INTO user_feature_flags (user_id, feature_flag_id, is_enabled, reason) 
SELECT 
  '123e4567-e89b-12d3-a456-426614174000',
  id,
  true,
  'Admin user - full access'
FROM feature_flags 
WHERE name IN ('premium-models', 'beta-features', 'realtime-collaboration');

INSERT INTO user_feature_flags (user_id, feature_flag_id, is_enabled, reason)
SELECT 
  '789e1234-e89b-12d3-a456-426614174000',
  id,
  true,
  'Beta tester'
FROM feature_flags 
WHERE name IN ('beta-features', 'realtime-collaboration');

-- Create some analytics data for testing
INSERT INTO feature_flag_analytics (feature_flag_id, user_id, event_type, event_data) 
SELECT 
  ff.id,
  '123e4567-e89b-12d3-a456-426614174000',
  'evaluated',
  jsonb_build_object('enabled', true, 'reason', 'admin_override')
FROM feature_flags ff
WHERE ff.name IN ('new-chat-ui', 'premium-models', 'ai-streaming');

INSERT INTO feature_flag_analytics (feature_flag_id, user_id, event_type, event_data) 
SELECT 
  ff.id,
  '456e7890-e89b-12d3-a456-426614174000',
  'evaluated',
  jsonb_build_object('enabled', false, 'reason', 'rollout_percentage')
FROM feature_flags ff
WHERE ff.name IN ('premium-models', 'beta-features');

-- Test the evaluation function
SELECT 
  'Testing feature flag evaluation:' as test_description,
  name,
  evaluate_feature_flag(name, '123e4567-e89b-12d3-a456-426614174000', 'development') as admin_result,
  evaluate_feature_flag(name, '456e7890-e89b-12d3-a456-426614174000', 'development') as user_result,
  evaluate_feature_flag(name, '789e1234-e89b-12d3-a456-426614174000', 'development') as beta_result
FROM feature_flags 
WHERE name IN ('new-chat-ui', 'premium-models', 'beta-features', 'realtime-collaboration')
ORDER BY name;

-- Test the user feature flags function
SELECT 
  'Testing get_user_feature_flags function:' as test_description,
  flag_name,
  is_enabled,
  description
FROM get_user_feature_flags('123e4567-e89b-12d3-a456-426614174000', 'development')
ORDER BY flag_name;

-- Display current feature flag statistics
SELECT * FROM feature_flag_stats ORDER BY name;

-- Display the test setup summary
SELECT 
  'Test data setup summary:' as summary,
  (SELECT COUNT(*) FROM feature_flags) as total_flags,
  (SELECT COUNT(*) FROM user_feature_flags) as total_overrides,
  (SELECT COUNT(*) FROM feature_flag_analytics) as total_analytics_events;
