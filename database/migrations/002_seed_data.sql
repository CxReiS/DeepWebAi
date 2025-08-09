-- Seed Data for DeepWebAI
-- Migration: 002_seed_data.sql
-- Created: 2024-01-15

-- Insert default feature flags
INSERT INTO feature_flags (key, name, description, is_enabled, rollout_percentage, metadata) VALUES
('premium_models', 'Premium AI Models', 'Access to premium AI models like GPT-4 and Claude', false, 0, '{"models": ["gpt-4", "claude-3-opus"]}'),
('file_ocr', 'File OCR Processing', 'Enable OCR text extraction from images and PDFs', true, 100, '{"max_file_size": 50000000}'),
('real_time_chat', 'Real-time Chat', 'Enable real-time chat features with WebSocket', true, 100, '{}'),
('advanced_analytics', 'Advanced Analytics', 'Enable detailed analytics and reporting features', false, 25, '{}'),
('beta_features', 'Beta Features', 'Access to experimental beta features', false, 10, '{"requires_opt_in": true}'),
('api_rate_limiting', 'API Rate Limiting', 'Enable rate limiting for API endpoints', true, 100, '{"default_limit": 100, "window_ms": 900000}'),
('multi_language_support', 'Multi-language Support', 'Support for multiple languages in OCR and chat', true, 100, '{"supported_languages": ["en", "tr", "es", "fr", "de"]}'),
('file_sharing', 'File Sharing', 'Allow users to share files with other users', false, 50, '{"max_shared_files": 10}'),
('ai_model_selection', 'AI Model Selection', 'Allow users to choose their preferred AI model', true, 100, '{}'),
('conversation_export', 'Conversation Export', 'Export conversations to various formats', false, 75, '{"formats": ["pdf", "txt", "json"]}')
ON CONFLICT (key) DO NOTHING;

-- Insert admin user (password: admin123456)
-- Note: This should be changed in production
INSERT INTO users (
    id,
    email, 
    username, 
    password_hash, 
    display_name, 
    role, 
    is_verified, 
    is_active,
    preferences,
    email_verified_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@deepwebai.com',
    'admin',
    '$2b$10$8K1p/a0dRTOfSxWOHqtUrOBjNp.Jm9KN9z9R8X.qQ0YG5Y8X9K0K.',
    'DeepWebAI Administrator',
    'admin',
    true,
    true,
    '{"theme": "dark", "language": "en", "notifications": true}',
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert demo user (password: demo123456)
INSERT INTO users (
    id,
    email, 
    username, 
    password_hash, 
    display_name, 
    role, 
    is_verified, 
    is_active,
    preferences,
    email_verified_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'demo@deepwebai.com',
    'demo',
    '$2b$10$9L2q/b1eSTQgTyXPJruvVPCkOq.Km0LO0a0S9Y.rR1ZH6Z9Y0L1L.',
    'Demo User',
    'user',
    true,
    true,
    '{"theme": "light", "language": "en", "notifications": false}',
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert test user (password: test123456)
INSERT INTO users (
    id,
    email, 
    username, 
    password_hash, 
    display_name, 
    role, 
    is_verified, 
    is_active,
    preferences,
    email_verified_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'test@deepwebai.com',
    'testuser',
    '$2b$10$0M3r/c2fSUQhUzYQKsuwWQDlPr.Ln1MP1b1T0Z.sS2aI7a0Z1M2M.',
    'Test User',
    'user',
    true,
    true,
    '{"theme": "auto", "language": "en", "notifications": true}',
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Enable premium features for admin
INSERT INTO user_feature_flags (user_id, feature_flag_id, is_enabled) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    id,
    true
FROM feature_flags 
WHERE key IN ('premium_models', 'advanced_analytics', 'beta_features', 'conversation_export')
ON CONFLICT (user_id, feature_flag_id) DO NOTHING;

-- Create sample conversation for demo user
INSERT INTO conversations (
    id,
    user_id,
    title,
    model,
    system_prompt,
    metadata
) VALUES (
    '660e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'Welcome to DeepWebAI',
    'gpt-3.5-turbo',
    'You are a helpful AI assistant for DeepWebAI platform.',
    '{"created_via": "demo", "category": "general"}'
) ON CONFLICT (id) DO NOTHING;

-- Add sample messages to the conversation
INSERT INTO messages (conversation_id, role, content, token_count) VALUES
(
    '660e8400-e29b-41d4-a716-446655440000',
    'user',
    'Hello! I''m new to DeepWebAI. Can you help me understand what this platform can do?',
    25
),
(
    '660e8400-e29b-41d4-a716-446655440000',
    'assistant',
    'Welcome to DeepWebAI! I''d be happy to help you get started. DeepWebAI is an advanced AI-powered platform that offers several powerful features:

🤖 **Multi-Provider AI Chat**: Interact with various AI models including GPT-4, Claude, and Gemini
📄 **Document Processing**: Upload and analyze documents with OCR text extraction
🔍 **Intelligent Analysis**: Ask questions about your documents and get detailed insights
🚀 **Real-time Collaboration**: Chat and collaborate with others in real-time
🎛️ **Feature Flags**: Customize your experience with dynamic feature control

To get started, try uploading a document and asking me questions about it, or simply start a conversation about any topic you''re interested in. What would you like to explore first?',
    150
) ON CONFLICT DO NOTHING;

-- Insert sample analytics events
INSERT INTO analytics_events (user_id, event_type, event_name, properties) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'user', 'login', '{"method": "email"}'),
('550e8400-e29b-41d4-a716-446655440001', 'conversation', 'created', '{"model": "gpt-3.5-turbo"}'),
('550e8400-e29b-41d4-a716-446655440001', 'message', 'sent', '{"token_count": 25}'),
('550e8400-e29b-41d4-a716-446655440002', 'user', 'login', '{"method": "email"}'),
('550e8400-e29b-41d4-a716-446655440000', 'admin', 'feature_flag_updated', '{"flag": "premium_models", "enabled": true}')
ON CONFLICT DO NOTHING;

-- Insert sample API usage data
INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time_ms) VALUES
('550e8400-e29b-41d4-a716-446655440001', '/api/auth/me', 'GET', 200, 45),
('550e8400-e29b-41d4-a716-446655440001', '/api/conversations', 'GET', 200, 120),
('550e8400-e29b-41d4-a716-446655440001', '/api/conversations', 'POST', 201, 89),
('550e8400-e29b-41d4-a716-446655440002', '/api/auth/me', 'GET', 200, 38),
('550e8400-e29b-41d4-a716-446655440000', '/api/feature-flags', 'GET', 200, 67)
ON CONFLICT DO NOTHING;

-- Create some indexes for better query performance on analytics tables
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON analytics_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON api_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_provider_usage_user_created ON ai_provider_usage(user_id, created_at);

-- Insert configuration data (stored as feature flags)
INSERT INTO feature_flags (key, name, description, is_enabled, rollout_percentage, metadata) VALUES
('max_file_size', 'Maximum File Size', 'Maximum allowed file size for uploads in bytes', true, 100, '{"value": 52428800, "unit": "bytes"}'),
('supported_file_types', 'Supported File Types', 'List of supported file types for upload', true, 100, '{"types": ["pdf", "jpg", "jpeg", "png", "gif", "doc", "docx", "txt", "md"]}'),
('ai_models_config', 'AI Models Configuration', 'Configuration for available AI models', true, 100, '{"models": {"gpt-3.5-turbo": {"provider": "openai", "cost_per_token": 0.000002}, "gpt-4": {"provider": "openai", "cost_per_token": 0.00003}, "claude-3-sonnet": {"provider": "anthropic", "cost_per_token": 0.000015}}}'),
('rate_limits', 'Rate Limiting Configuration', 'API rate limiting settings', true, 100, '{"api": {"requests_per_window": 100, "window_ms": 900000}, "ai": {"requests_per_minute": 20}, "uploads": {"files_per_hour": 50}}}')
ON CONFLICT (key) DO NOTHING;

-- Add helpful comments for future developers
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE sessions IS 'User authentication sessions managed by NextAuth.js';
COMMENT ON TABLE files IS 'Uploaded files and their metadata';
COMMENT ON TABLE conversations IS 'AI chat conversations';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE feature_flags IS 'Dynamic feature control and configuration';
COMMENT ON TABLE analytics_events IS 'User interaction and system events for analytics';
COMMENT ON TABLE api_usage IS 'API endpoint usage tracking for monitoring and billing';

-- Create a view for active users (useful for analytics)
CREATE OR REPLACE VIEW active_users AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.role,
    u.created_at,
    u.last_login_at,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(DISTINCT f.id) as file_count
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id AND c.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
LEFT JOIN files f ON u.id = f.user_id AND f.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
WHERE u.is_active = true AND u.deleted_at IS NULL
GROUP BY u.id, u.email, u.username, u.display_name, u.role, u.created_at, u.last_login_at;

-- Create a view for feature flag status per user
CREATE OR REPLACE VIEW user_feature_flag_status AS
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    ff.key as feature_key,
    ff.name as feature_name,
    COALESCE(uff.is_enabled, 
        CASE 
            WHEN ff.rollout_percentage = 100 THEN ff.is_enabled
            WHEN ff.rollout_percentage = 0 THEN false
            ELSE (hashtext(u.id::text || ff.key) % 100) < ff.rollout_percentage
        END
    ) as is_enabled
FROM users u
CROSS JOIN feature_flags ff
LEFT JOIN user_feature_flags uff ON u.id = uff.user_id AND ff.id = uff.feature_flag_id
WHERE u.is_active = true AND u.deleted_at IS NULL;
