-- @id: 003_create_api_usage
-- @name: Create API usage tracking tables
-- @description: Track API usage, costs, and performance metrics
-- @dependencies: 001_create_conversations

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model_id UUID REFERENCES ai_models(id),
    endpoint VARCHAR(255),
    method VARCHAR(10),
    tokens_used INTEGER,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6),
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    request_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_size_seconds INTEGER NOT NULL,
    request_count INTEGER DEFAULT 1,
    max_requests INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint, window_start)
);

-- Usage quotas table
CREATE TABLE IF NOT EXISTS usage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quota_type VARCHAR(100) NOT NULL, -- 'tokens', 'requests', 'cost'
    period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    limit_value DECIMAL(15, 6) NOT NULL,
    used_value DECIMAL(15, 6) DEFAULT 0,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quota_type, period)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_model_id ON api_usage(model_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_user_type ON usage_quotas(user_id, quota_type);

-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id UUID,
    p_endpoint VARCHAR(255),
    p_max_requests INTEGER,
    p_window_seconds INTEGER DEFAULT 3600
) RETURNS BOOLEAN AS $$
DECLARE
    current_window TIMESTAMP WITH TIME ZONE;
    current_count INTEGER;
BEGIN
    current_window := date_trunc('hour', NOW());
    
    -- Get current count for this window
    SELECT COALESCE(request_count, 0) INTO current_count
    FROM rate_limits 
    WHERE user_id = p_user_id 
      AND endpoint = p_endpoint 
      AND window_start = current_window;
    
    -- Check if limit exceeded
    IF current_count >= p_max_requests THEN
        RETURN FALSE;
    END IF;
    
    -- Update or insert rate limit record
    INSERT INTO rate_limits (user_id, endpoint, window_start, window_size_seconds, request_count, max_requests)
    VALUES (p_user_id, p_endpoint, current_window, p_window_seconds, 1, p_max_requests)
    ON CONFLICT (user_id, endpoint, window_start)
    DO UPDATE SET 
        request_count = rate_limits.request_count + 1,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update usage quota
CREATE OR REPLACE FUNCTION update_usage_quota(
    p_user_id UUID,
    p_quota_type VARCHAR(100),
    p_period VARCHAR(50),
    p_usage_amount DECIMAL(15, 6)
) RETURNS BOOLEAN AS $$
DECLARE
    current_quota usage_quotas%ROWTYPE;
    next_reset TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate next reset time based on period
    CASE p_period
        WHEN 'daily' THEN next_reset := date_trunc('day', NOW()) + INTERVAL '1 day';
        WHEN 'weekly' THEN next_reset := date_trunc('week', NOW()) + INTERVAL '1 week';
        WHEN 'monthly' THEN next_reset := date_trunc('month', NOW()) + INTERVAL '1 month';
        ELSE next_reset := date_trunc('day', NOW()) + INTERVAL '1 day';
    END CASE;
    
    -- Get current quota
    SELECT * INTO current_quota
    FROM usage_quotas 
    WHERE user_id = p_user_id 
      AND quota_type = p_quota_type 
      AND period = p_period;
    
    -- Reset quota if expired
    IF current_quota.reset_at <= NOW() THEN
        UPDATE usage_quotas 
        SET used_value = p_usage_amount, 
            reset_at = next_reset,
            updated_at = NOW()
        WHERE id = current_quota.id;
    ELSE
        -- Update existing quota
        UPDATE usage_quotas 
        SET used_value = used_value + p_usage_amount,
            updated_at = NOW()
        WHERE id = current_quota.id;
        
        -- Check if limit exceeded
        SELECT * INTO current_quota
        FROM usage_quotas 
        WHERE id = current_quota.id;
        
        IF current_quota.used_value > current_quota.limit_value THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Updated_at triggers
CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_quotas_updated_at 
    BEFORE UPDATE ON usage_quotas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
