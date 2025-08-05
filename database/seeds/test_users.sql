-- Test users for development and testing environments
-- These users are specifically designed for automated testing

-- Test admin user
INSERT INTO users (
    id,
    email,
    username,
    display_name,
    role,
    is_verified,
    bio,
    preferences
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test-admin@test.local',
    'test_admin',
    'Test Administrator',
    'admin',
    true,
    'Test administrator account for automated testing.',
    '{"theme": "dark", "language": "en", "notifications": false, "testing": true}'
) ON CONFLICT (email) DO NOTHING;

-- Test premium user
INSERT INTO users (
    id,
    email,
    username,
    display_name,
    role,
    is_verified,
    bio,
    preferences
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'test-premium@test.local',
    'test_premium',
    'Test Premium User',
    'premium',
    true,
    'Test premium account for feature testing.',
    '{"theme": "light", "language": "en", "notifications": false, "testing": true}'
) ON CONFLICT (email) DO NOTHING;

-- Test regular users
INSERT INTO users (
    id,
    email,
    username,
    display_name,
    role,
    is_verified,
    bio,
    preferences
) VALUES 
(
    '00000000-0000-0000-0000-000000000003',
    'test-user1@test.local',
    'test_user1',
    'Test User One',
    'user',
    true,
    'First test user for general functionality testing.',
    '{"theme": "auto", "language": "en", "notifications": false, "testing": true}'
),
(
    '00000000-0000-0000-0000-000000000004',
    'test-user2@test.local',
    'test_user2',
    'Test User Two',
    'user',
    false,
    'Second test user for unverified user testing.',
    '{"theme": "dark", "language": "en", "notifications": false, "testing": true}'
),
(
    '00000000-0000-0000-0000-000000000005',
    'test-user3@test.local',
    'test_user3',
    'Test User Three',
    'user',
    true,
    'Third test user for various test scenarios.',
    '{"theme": "light", "language": "es", "notifications": true, "testing": true}'
) ON CONFLICT (email) DO NOTHING;

-- Test conversations for testing chat functionality
INSERT INTO conversations (
    id,
    user_id,
    title,
    model_id,
    system_prompt,
    metadata
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'Test Conversation 1',
    '22222222-2222-2222-2222-222222222222', -- GPT-3.5 Turbo
    'You are a helpful assistant for testing purposes.',
    '{"testing": true, "automated": false}'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'Test Code Generation',
    '88888888-8888-8888-8888-888888888888', -- DeepSeek Coder
    'You are a code generation assistant for testing.',
    '{"testing": true, "automated": true, "type": "coding"}'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'Test Long Context',
    '44444444-4444-4444-4444-444444444444', -- Claude 3 Opus
    'You are testing long context conversations.',
    '{"testing": true, "automated": false, "type": "long_context"}'
) ON CONFLICT (id) DO NOTHING;

-- Test messages for conversation testing
INSERT INTO messages (
    id,
    conversation_id,
    role,
    content,
    token_count,
    metadata
) VALUES 
-- Conversation 1 messages
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'user',
    'Hello, this is a test message.',
    7,
    '{"testing": true}'
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'assistant',
    'Hello! I understand this is a test. How can I help you today?',
    14,
    '{"testing": true, "response_time_ms": 250}'
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'user',
    'Can you help me test the conversation functionality?',
    9,
    '{"testing": true}'
),

-- Conversation 2 messages (coding)
(
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'user',
    'Write a simple Python function to calculate fibonacci numbers.',
    10,
    '{"testing": true, "type": "coding"}'
),
(
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    'assistant',
    'Here''s a simple Python function to calculate Fibonacci numbers:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```',
    45,
    '{"testing": true, "type": "coding", "language": "python"}'
),

-- Conversation 3 messages (long context)
(
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000003',
    'user',
    'This is a test message for long context handling. Let me provide some context about our project...',
    18,
    '{"testing": true, "type": "long_context"}'
) ON CONFLICT (id) DO NOTHING;

-- Test API usage records
INSERT INTO api_usage (
    id,
    user_id,
    model_id,
    endpoint,
    method,
    tokens_used,
    prompt_tokens,
    completion_tokens,
    cost_usd,
    response_time_ms,
    status_code,
    request_metadata
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    '/v1/chat/completions',
    'POST',
    21,
    7,
    14,
    0.0000315,
    250,
    200,
    '{"testing": true, "conversation_id": "10000000-0000-0000-0000-000000000001"}'
),
(
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '88888888-8888-8888-8888-888888888888',
    '/v1/chat/completions',
    'POST',
    55,
    10,
    45,
    0.0000154,
    180,
    200,
    '{"testing": true, "conversation_id": "10000000-0000-0000-0000-000000000002"}'
) ON CONFLICT (id) DO NOTHING;

-- Test files for file processing testing
INSERT INTO files (
    id,
    user_id,
    filename,
    original_name,
    file_type,
    file_size,
    mime_type,
    storage_path,
    processing_status,
    extracted_text,
    metadata
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    'test-document-1.txt',
    'test-document.txt',
    'text',
    1024,
    'text/plain',
    '/uploads/test/test-document-1.txt',
    'completed',
    'This is a test document for testing file processing functionality.',
    '{"testing": true, "uploaded_for": "text_processing_test"}'
),
(
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'test-image-1.png',
    'test-image.png',
    'image',
    204800,
    'image/png',
    '/uploads/test/test-image-1.png',
    'pending',
    null,
    '{"testing": true, "uploaded_for": "image_processing_test"}'
) ON CONFLICT (id) DO NOTHING;

-- Test embeddings for similarity search testing
INSERT INTO embeddings (
    id,
    content_id,
    content_type,
    content_chunk,
    embedding,
    metadata
) VALUES 
(
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'file',
    'This is a test document for testing file processing functionality.',
    '[0.1, 0.2, 0.3]'::vector, -- Simplified vector for testing
    '{"testing": true, "chunk_index": 0}'
) ON CONFLICT (id) DO NOTHING;

-- Test usage quotas
INSERT INTO usage_quotas (
    user_id,
    quota_type,
    period,
    limit_value,
    used_value,
    reset_at
) VALUES 
(
    '00000000-0000-0000-0000-000000000003',
    'tokens',
    'daily',
    1000,
    76,
    date_trunc('day', NOW()) + INTERVAL '1 day'
),
(
    '00000000-0000-0000-0000-000000000004',
    'tokens',
    'daily',
    1000,
    0,
    date_trunc('day', NOW()) + INTERVAL '1 day'
) ON CONFLICT (user_id, quota_type, period) DO NOTHING;
