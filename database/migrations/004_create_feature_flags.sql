-- @id: 004_create_feature_flags
-- @name: Create feature flags and user overrides
-- @description: Feature flag system for A/B testing and gradual rollouts
-- @dependencies: 001_create_conversations

-- Feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    conditions JSONB DEFAULT '{}',
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_groups JSONB DEFAULT '[]',
    environment VARCHAR(50) DEFAULT 'all',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User feature flag overrides
CREATE TABLE IF NOT EXISTS user_feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL,
    reason VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, feature_flag_id)
);

-- Feature flag analytics
CREATE TABLE IF NOT EXISTS feature_flag_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- 'enabled', 'disabled', 'evaluated'
    event_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_feature_flags_user_id ON user_feature_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_flags_flag_id ON user_feature_flags(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_analytics_flag_id ON feature_flag_analytics(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_analytics_created_at ON feature_flag_analytics(created_at);

-- Function to evaluate feature flag for user
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
    p_flag_name VARCHAR(255),
    p_user_id UUID,
    p_environment VARCHAR(50) DEFAULT 'production'
) RETURNS BOOLEAN AS $$
DECLARE
    flag_record feature_flags%ROWTYPE;
    user_override user_feature_flags%ROWTYPE;
    user_hash INTEGER;
    rollout_threshold INTEGER;
BEGIN
    -- Get feature flag
    SELECT * INTO flag_record
    FROM feature_flags 
    WHERE name = p_flag_name 
      AND (environment = p_environment OR environment = 'all')
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW());
    
    -- Flag not found or disabled
    IF NOT FOUND OR NOT flag_record.is_enabled THEN
        RETURN FALSE;
    END IF;
    
    -- Check for user override
    SELECT * INTO user_override
    FROM user_feature_flags 
    WHERE user_id = p_user_id 
      AND feature_flag_id = flag_record.id
      AND (expires_at IS NULL OR expires_at >= NOW());
    
    -- Use override if exists
    IF FOUND THEN
        -- Log analytics
        INSERT INTO feature_flag_analytics (feature_flag_id, user_id, event_type, event_data)
        VALUES (flag_record.id, p_user_id, 'evaluated', '{"override": true, "enabled": ' || user_override.is_enabled || '}');
        
        RETURN user_override.is_enabled;
    END IF;
    
    -- Calculate rollout percentage
    IF flag_record.rollout_percentage = 100 THEN
        -- Log analytics
        INSERT INTO feature_flag_analytics (feature_flag_id, user_id, event_type, event_data)
        VALUES (flag_record.id, p_user_id, 'evaluated', '{"rollout": "100%", "enabled": true}');
        
        RETURN TRUE;
    ELSIF flag_record.rollout_percentage = 0 THEN
        -- Log analytics
        INSERT INTO feature_flag_analytics (feature_flag_id, user_id, event_type, event_data)
        VALUES (flag_record.id, p_user_id, 'evaluated', '{"rollout": "0%", "enabled": false}');
        
        RETURN FALSE;
    ELSE
        -- Hash user ID to get consistent percentage
        user_hash := abs(hashtext(p_user_id::text)) % 100;
        rollout_threshold := flag_record.rollout_percentage;
        
        -- Log analytics
        INSERT INTO feature_flag_analytics (feature_flag_id, user_id, event_type, event_data)
        VALUES (flag_record.id, p_user_id, 'evaluated', 
                jsonb_build_object(
                    'rollout', flag_record.rollout_percentage || '%',
                    'user_hash', user_hash,
                    'enabled', user_hash < rollout_threshold
                ));
        
        RETURN user_hash < rollout_threshold;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get feature flags for user
CREATE OR REPLACE FUNCTION get_user_feature_flags(
    p_user_id UUID,
    p_environment VARCHAR(50) DEFAULT 'production'
) RETURNS TABLE (
    flag_name VARCHAR(255),
    is_enabled BOOLEAN,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ff.name,
        evaluate_feature_flag(ff.name, p_user_id, p_environment),
        ff.description
    FROM feature_flags ff
    WHERE ff.is_enabled = TRUE
      AND (ff.environment = p_environment OR ff.environment = 'all')
      AND (ff.start_date IS NULL OR ff.start_date <= NOW())
      AND (ff.end_date IS NULL OR ff.end_date >= NOW());
END;
$$ LANGUAGE plpgsql;

-- View for feature flag statistics
CREATE OR REPLACE VIEW feature_flag_stats AS
SELECT 
    ff.id,
    ff.name,
    ff.rollout_percentage,
    COUNT(DISTINCT ffa.user_id) as unique_users,
    COUNT(CASE WHEN ffa.event_data->>'enabled' = 'true' THEN 1 END) as enabled_evaluations,
    COUNT(CASE WHEN ffa.event_data->>'enabled' = 'false' THEN 1 END) as disabled_evaluations,
    COUNT(*) as total_evaluations,
    ROUND(
        (COUNT(CASE WHEN ffa.event_data->>'enabled' = 'true' THEN 1 END)::FLOAT / 
         NULLIF(COUNT(*), 0) * 100), 2
    ) as actual_enabled_percentage
FROM feature_flags ff
LEFT JOIN feature_flag_analytics ffa ON ff.id = ffa.feature_flag_id
WHERE ffa.event_type = 'evaluated'
  AND ffa.created_at >= NOW() - INTERVAL '7 days'
GROUP BY ff.id, ff.name, ff.rollout_percentage;

-- Updated_at triggers
CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
