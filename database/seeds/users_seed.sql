-- User seed data for development and testing
-- Insert sample users with different roles and permissions

-- Admin user
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
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@deepweb.ai',
    'admin',
    'System Administrator',
    'admin',
    true,
    'System administrator with full access to all features.',
    '{"theme": "dark", "language": "en", "notifications": true}'
) ON CONFLICT (email) DO NOTHING;

-- Developer user
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
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'dev@deepweb.ai',
    'developer',
    'Lead Developer',
    'developer',
    true,
    'Lead developer working on AI integration and core features.',
    '{"theme": "dark", "language": "en", "notifications": true, "debugMode": true}'
) ON CONFLICT (email) DO NOTHING;

-- Premium user
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
    'c3d4e5f6-g7h8-9012-cdef-345678901234',
    'premium@example.com',
    'premium_user',
    'Premium User',
    'premium',
    true,
    'Premium subscriber with access to advanced AI models.',
    '{"theme": "light", "language": "en", "notifications": true, "modelPreference": "gpt-4"}'
) ON CONFLICT (email) DO NOTHING;

-- Regular users
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
    'd4e5f6g7-h8i9-0123-defg-456789012345',
    'alice@example.com',
    'alice_chen',
    'Alice Chen',
    'user',
    true,
    'AI researcher interested in natural language processing.',
    '{"theme": "light", "language": "en", "notifications": false}'
),
(
    'e5f6g7h8-i9j0-1234-efgh-567890123456',
    'bob@example.com',
    'bob_smith',
    'Bob Smith',
    'user',
    true,
    'Software engineer exploring AI-assisted coding.',
    '{"theme": "dark", "language": "en", "notifications": true}'
),
(
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'carol@example.com',
    'carol_davis',
    'Carol Davis',
    'user',
    false,
    'Data scientist working with machine learning models.',
    '{"theme": "auto", "language": "en", "notifications": true}'
),
(
    'g7h8i9j0-k1l2-3456-ghij-789012345678',
    'david@example.com',
    'david_wilson',
    'David Wilson',
    'user',
    true,
    'Product manager interested in AI applications.',
    '{"theme": "light", "language": "en", "notifications": false}'
),
(
    'h8i9j0k1-l2m3-4567-hijk-890123456789',
    'emma@example.com',
    'emma_johnson',
    'Emma Johnson',
    'user',
    true,
    'UX designer exploring AI-human interaction patterns.',
    '{"theme": "dark", "language": "en", "notifications": true}'
) ON CONFLICT (email) DO NOTHING;

-- Insert OAuth accounts for some users
INSERT INTO oauth_accounts (
    user_id,
    provider,
    provider_user_id,
    provider_username
) VALUES 
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'github',
    '123456789',
    'admin-deepweb'
),
(
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'github',
    '987654321',
    'dev-deepweb'
),
(
    'd4e5f6g7-h8i9-0123-defg-456789012345',
    'discord',
    '555666777888',
    'alice_chen#1234'
),
(
    'e5f6g7h8-i9j0-1234-efgh-567890123456',
    'github',
    '111222333444',
    'bob-codes'
) ON CONFLICT (provider, provider_user_id) DO NOTHING;

-- Insert usage quotas for users
INSERT INTO usage_quotas (
    user_id,
    quota_type,
    period,
    limit_value,
    reset_at
) VALUES 
-- Admin user - unlimited
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'tokens',
    'monthly',
    1000000,
    date_trunc('month', NOW()) + INTERVAL '1 month'
),
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'requests',
    'daily',
    10000,
    date_trunc('day', NOW()) + INTERVAL '1 day'
),
-- Premium user - higher limits
(
    'c3d4e5f6-g7h8-9012-cdef-345678901234',
    'tokens',
    'monthly',
    100000,
    date_trunc('month', NOW()) + INTERVAL '1 month'
),
(
    'c3d4e5f6-g7h8-9012-cdef-345678901234',
    'requests',
    'daily',
    1000,
    date_trunc('day', NOW()) + INTERVAL '1 day'
),
-- Regular users - standard limits
(
    'd4e5f6g7-h8i9-0123-defg-456789012345',
    'tokens',
    'monthly',
    10000,
    date_trunc('month', NOW()) + INTERVAL '1 month'
),
(
    'e5f6g7h8-i9j0-1234-efgh-567890123456',
    'tokens',
    'monthly',
    10000,
    date_trunc('month', NOW()) + INTERVAL '1 month'
),
(
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'tokens',
    'monthly',
    10000,
    date_trunc('month', NOW()) + INTERVAL '1 month'
) ON CONFLICT (user_id, quota_type, period) DO NOTHING;
