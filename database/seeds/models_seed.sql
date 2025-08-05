-- AI Models seed data
-- Insert available AI models with their capabilities and pricing

-- OpenAI Models
INSERT INTO ai_models (
    id,
    name,
    provider,
    model_type,
    version,
    api_endpoint,
    capabilities,
    pricing_info,
    context_length,
    max_tokens,
    is_active
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'GPT-4 Turbo',
    'openai',
    'chat',
    'gpt-4-1106-preview',
    'https://api.openai.com/v1/chat/completions',
    '["text_generation", "code_generation", "reasoning", "analysis"]',
    '{"input_cost_per_1k": 0.01, "output_cost_per_1k": 0.03, "currency": "USD"}',
    128000,
    4096,
    true
),
(
    '22222222-2222-2222-2222-222222222222',
    'GPT-3.5 Turbo',
    'openai',
    'chat',
    'gpt-3.5-turbo',
    'https://api.openai.com/v1/chat/completions',
    '["text_generation", "code_generation", "conversation"]',
    '{"input_cost_per_1k": 0.0015, "output_cost_per_1k": 0.002, "currency": "USD"}',
    16385,
    4096,
    true
),
(
    '33333333-3333-3333-3333-333333333333',
    'GPT-4 Vision',
    'openai',
    'multimodal',
    'gpt-4-vision-preview',
    'https://api.openai.com/v1/chat/completions',
    '["text_generation", "image_analysis", "multimodal"]',
    '{"input_cost_per_1k": 0.01, "output_cost_per_1k": 0.03, "currency": "USD"}',
    128000,
    4096,
    true
),

-- Anthropic Models
(
    '44444444-4444-4444-4444-444444444444',
    'Claude 3 Opus',
    'anthropic',
    'chat',
    'claude-3-opus-20240229',
    'https://api.anthropic.com/v1/messages',
    '["text_generation", "reasoning", "analysis", "code_generation"]',
    '{"input_cost_per_1k": 0.015, "output_cost_per_1k": 0.075, "currency": "USD"}',
    200000,
    4096,
    true
),
(
    '55555555-5555-5555-5555-555555555555',
    'Claude 3 Sonnet',
    'anthropic',
    'chat',
    'claude-3-sonnet-20240229',
    'https://api.anthropic.com/v1/messages',
    '["text_generation", "reasoning", "analysis"]',
    '{"input_cost_per_1k": 0.003, "output_cost_per_1k": 0.015, "currency": "USD"}',
    200000,
    4096,
    true
),
(
    '66666666-6666-6666-6666-666666666666',
    'Claude 3 Haiku',
    'anthropic',
    'chat',
    'claude-3-haiku-20240307',
    'https://api.anthropic.com/v1/messages',
    '["text_generation", "fast_response"]',
    '{"input_cost_per_1k": 0.00025, "output_cost_per_1k": 0.00125, "currency": "USD"}',
    200000,
    4096,
    true
),

-- DeepSeek Models
(
    '77777777-7777-7777-7777-777777777777',
    'DeepSeek Chat',
    'deepseek',
    'chat',
    'deepseek-chat',
    'https://api.deepseek.com/v1/chat/completions',
    '["text_generation", "reasoning", "code_generation"]',
    '{"input_cost_per_1k": 0.00014, "output_cost_per_1k": 0.00028, "currency": "USD"}',
    32768,
    4096,
    true
),
(
    '88888888-8888-8888-8888-888888888888',
    'DeepSeek Coder',
    'deepseek',
    'code',
    'deepseek-coder',
    'https://api.deepseek.com/v1/chat/completions',
    '["code_generation", "code_review", "debugging"]',
    '{"input_cost_per_1k": 0.00014, "output_cost_per_1k": 0.00028, "currency": "USD"}',
    16384,
    4096,
    true
),

-- Google Models
(
    '99999999-9999-9999-9999-999999999999',
    'Gemini Pro',
    'google',
    'chat',
    'gemini-pro',
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    '["text_generation", "reasoning", "analysis"]',
    '{"input_cost_per_1k": 0.0005, "output_cost_per_1k": 0.0015, "currency": "USD"}',
    32768,
    8192,
    true
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Gemini Pro Vision',
    'google',
    'multimodal',
    'gemini-pro-vision',
    'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent',
    '["text_generation", "image_analysis", "multimodal"]',
    '{"input_cost_per_1k": 0.0005, "output_cost_per_1k": 0.0015, "currency": "USD"}',
    16384,
    8192,
    true
),

-- Local Models
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Llama 3.1 8B',
    'local',
    'chat',
    'llama-3.1-8b-instruct',
    'http://localhost:8000/v1/chat/completions',
    '["text_generation", "reasoning", "local_inference"]',
    '{"cost_per_1k": 0, "currency": "USD", "note": "Local inference"}',
    128000,
    4096,
    false
),
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Mixtral 8x7B',
    'local',
    'chat',
    'mixtral-8x7b-instruct',
    'http://localhost:8000/v1/chat/completions',
    '["text_generation", "reasoning", "code_generation", "local_inference"]',
    '{"cost_per_1k": 0, "currency": "USD", "note": "Local inference"}',
    32768,
    4096,
    false
),

-- Embedding Models
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'text-embedding-3-large',
    'openai',
    'embedding',
    'text-embedding-3-large',
    'https://api.openai.com/v1/embeddings',
    '["text_embedding", "semantic_search"]',
    '{"cost_per_1k": 0.00013, "currency": "USD"}',
    8191,
    3072,
    true
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'text-embedding-3-small',
    'openai',
    'embedding',
    'text-embedding-3-small',
    'https://api.openai.com/v1/embeddings',
    '["text_embedding", "semantic_search"]',
    '{"cost_per_1k": 0.00002, "currency": "USD"}',
    8191,
    1536,
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert model categories/tags
CREATE TABLE IF NOT EXISTS model_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, tag)
);

-- Add tags to models
INSERT INTO model_tags (model_id, tag) VALUES 
-- GPT-4 Turbo tags
('11111111-1111-1111-1111-111111111111', 'premium'),
('11111111-1111-1111-1111-111111111111', 'latest'),
('11111111-1111-1111-1111-111111111111', 'reasoning'),
('11111111-1111-1111-1111-111111111111', 'coding'),

-- GPT-3.5 Turbo tags
('22222222-2222-2222-2222-222222222222', 'fast'),
('22222222-2222-2222-2222-222222222222', 'affordable'),
('22222222-2222-2222-2222-222222222222', 'general'),

-- Claude tags
('44444444-4444-4444-4444-444444444444', 'premium'),
('44444444-4444-4444-4444-444444444444', 'reasoning'),
('44444444-4444-4444-4444-444444444444', 'long-context'),
('55555555-5555-5555-5555-555555555555', 'balanced'),
('55555555-5555-5555-5555-555555555555', 'reasoning'),
('66666666-6666-6666-6666-666666666666', 'fast'),
('66666666-6666-6666-6666-666666666666', 'affordable'),

-- DeepSeek tags
('77777777-7777-7777-7777-777777777777', 'affordable'),
('77777777-7777-7777-7777-777777777777', 'reasoning'),
('88888888-8888-8888-8888-888888888888', 'coding'),
('88888888-8888-8888-8888-888888888888', 'affordable'),

-- Local model tags
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'local'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'free'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'local'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'free'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'coding'),

-- Embedding tags
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'embedding'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'large'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'embedding'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'small'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'affordable')
ON CONFLICT (model_id, tag) DO NOTHING;

-- Create model performance metrics table
CREATE TABLE IF NOT EXISTS model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10, 4) NOT NULL,
    benchmark_name VARCHAR(100),
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Insert performance metrics
INSERT INTO model_performance (model_id, metric_name, metric_value, benchmark_name) VALUES 
-- GPT-4 metrics
('11111111-1111-1111-1111-111111111111', 'accuracy', 92.5, 'MMLU'),
('11111111-1111-1111-1111-111111111111', 'reasoning', 88.3, 'BBH'),
('11111111-1111-1111-1111-111111111111', 'coding', 85.4, 'HumanEval'),

-- Claude 3 Opus metrics  
('44444444-4444-4444-4444-444444444444', 'accuracy', 90.8, 'MMLU'),
('44444444-4444-4444-4444-444444444444', 'reasoning', 87.2, 'BBH'),
('44444444-4444-4444-4444-444444444444', 'coding', 82.1, 'HumanEval'),

-- DeepSeek metrics
('77777777-7777-7777-7777-777777777777', 'accuracy', 78.5, 'MMLU'),
('77777777-7777-7777-7777-777777777777', 'reasoning', 74.2, 'BBH'),
('88888888-8888-8888-8888-888888888888', 'coding', 79.3, 'HumanEval')
ON CONFLICT DO NOTHING;
