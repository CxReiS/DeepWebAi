-- MFA (Multi-Factor Authentication) Tables

-- User MFA secrets and configuration
CREATE TABLE IF NOT EXISTS user_mfa_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('totp', 'sms', 'email', 'backup_codes')),
    secret TEXT NOT NULL, -- TOTP secret, phone number, or email
    enabled BOOLEAN NOT NULL DEFAULT false,
    backup_codes JSONB, -- Array of backup codes for TOTP
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one MFA method per type per user
    UNIQUE(user_id, type)
);

-- MFA challenges for login flow
CREATE TABLE IF NOT EXISTS mfa_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- OAuth provider accounts
CREATE TABLE IF NOT EXISTS user_oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('github', 'discord', 'google', 'twitter')),
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique OAuth account per provider per user
    UNIQUE(user_id, provider),
    -- Ensure unique OAuth account across all users
    UNIQUE(provider, provider_user_id)
);

-- OAuth state management for security
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('github', 'discord', 'google', 'twitter')),
    redirect_url TEXT,
    used BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add MFA enabled flag to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'mfa_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mfa_secrets_user_id ON user_mfa_secrets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_secrets_type ON user_mfa_secrets(type);
CREATE INDEX IF NOT EXISTS idx_user_mfa_secrets_enabled ON user_mfa_secrets(enabled);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user_id ON mfa_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_session_id ON mfa_challenges(session_id);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires_at ON mfa_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_verified ON mfa_challenges(verified);

CREATE INDEX IF NOT EXISTS idx_user_oauth_accounts_user_id ON user_oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_accounts_provider ON user_oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_user_oauth_accounts_provider_user_id ON user_oauth_accounts(provider_user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_used ON oauth_states(used);

CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);

-- Add updated_at trigger for user_mfa_secrets
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_mfa_secrets_updated_at'
    ) THEN
        CREATE TRIGGER update_user_mfa_secrets_updated_at
            BEFORE UPDATE ON user_mfa_secrets
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_oauth_accounts_updated_at'
    ) THEN
        CREATE TRIGGER update_user_oauth_accounts_updated_at
            BEFORE UPDATE ON user_oauth_accounts
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Clean up expired MFA challenges (optional - can be run as a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_challenges()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM mfa_challenges 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired OAuth states (optional - can be run as a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM oauth_states 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to disable MFA for a user (admin function)
CREATE OR REPLACE FUNCTION disable_user_mfa(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete all MFA secrets for the user
    DELETE FROM user_mfa_secrets WHERE user_id = target_user_id;
    
    -- Update user MFA flag
    UPDATE users SET mfa_enabled = false WHERE id = target_user_id;
    
    -- Delete any pending MFA challenges
    DELETE FROM mfa_challenges WHERE user_id = target_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get user authentication methods
CREATE OR REPLACE FUNCTION get_user_auth_methods(target_user_id UUID)
RETURNS TABLE (
    has_password BOOLEAN,
    mfa_enabled BOOLEAN,
    oauth_providers TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (u.password_hash IS NOT NULL) as has_password,
        u.mfa_enabled,
        ARRAY_AGG(oa.provider) FILTER (WHERE oa.provider IS NOT NULL) as oauth_providers
    FROM users u
    LEFT JOIN user_oauth_accounts oa ON u.id = oa.user_id
    WHERE u.id = target_user_id
    GROUP BY u.id, u.password_hash, u.mfa_enabled;
END;
$$ LANGUAGE plpgsql;

-- View for user security overview
CREATE OR REPLACE VIEW user_security_overview AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.mfa_enabled,
    (u.password_hash IS NOT NULL) as has_password,
    COUNT(DISTINCT oa.provider) as oauth_account_count,
    ARRAY_AGG(DISTINCT oa.provider) FILTER (WHERE oa.provider IS NOT NULL) as oauth_providers,
    COUNT(DISTINCT mfa.type) FILTER (WHERE mfa.enabled = true) as active_mfa_methods,
    ARRAY_AGG(DISTINCT mfa.type) FILTER (WHERE mfa.enabled = true) as mfa_methods,
    u.created_at,
    u.last_login_at
FROM users u
LEFT JOIN user_oauth_accounts oa ON u.id = oa.user_id
LEFT JOIN user_mfa_secrets mfa ON u.id = mfa.user_id
GROUP BY u.id, u.email, u.username, u.mfa_enabled, u.password_hash, u.created_at, u.last_login_at;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_mfa_secrets TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON mfa_challenges TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON user_oauth_accounts TO app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON oauth_states TO app_user;
-- GRANT SELECT ON user_security_overview TO app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_mfa_challenges() TO app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_oauth_states() TO app_user;
-- GRANT EXECUTE ON FUNCTION get_user_auth_methods(UUID) TO app_user;

COMMENT ON TABLE user_mfa_secrets IS 'Stores MFA configuration and secrets for users';
COMMENT ON TABLE mfa_challenges IS 'Temporary challenges for MFA verification during login';
COMMENT ON TABLE user_oauth_accounts IS 'Links users to their OAuth provider accounts';
COMMENT ON TABLE oauth_states IS 'Temporary state storage for OAuth flow security';
COMMENT ON FUNCTION disable_user_mfa(UUID) IS 'Admin function to disable MFA for a user';
COMMENT ON FUNCTION get_user_auth_methods(UUID) IS 'Returns available authentication methods for a user';
COMMENT ON VIEW user_security_overview IS 'Comprehensive view of user security settings';
