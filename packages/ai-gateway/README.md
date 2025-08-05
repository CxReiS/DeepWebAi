# AI Gateway

A unified interface for multiple AI providers with automatic failover, rate limiting, and comprehensive monitoring.

## Features

- **Multiple Provider Support**: OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Local Llama
- **Automatic Failover**: Seamless switching between providers when one fails
- **Rate Limiting**: Built-in rate limiting per provider with configurable limits
- **Streaming Support**: Real-time streaming responses where supported
- **Retry Logic**: Configurable retry with exponential backoff
- **Health Monitoring**: Provider health checks and metrics tracking
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Configuration Management**: Environment-based or programmatic configuration

## Installation

```bash
pnpm add @deepwebai/ai-gateway @deepwebai/shared-types
```

## Quick Start

### Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com/v1  # optional

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Google Gemini
GOOGLE_AI_API_KEY=your_google_key

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1  # optional

# Local Llama (Ollama)
LOCAL_LLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_BASE_URL=http://localhost:11434/v1  # alternative

# Gateway Configuration
AI_GATEWAY_DEFAULT_PROVIDER=openai
AI_GATEWAY_FALLBACK_PROVIDERS=anthropic,gemini
```

### Basic Usage

```typescript
import { AIGateway } from '@deepwebai/ai-gateway';

// Initialize with environment variables
const gateway = new AIGateway();
await gateway.initialize();

// Simple chat completion
const response = await gateway.chat({
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ],
  model: 'gpt-4'
});

console.log(response.content);
```

### Streaming

```typescript
const stream = gateway.chatStream({
  messages: [
    { role: 'user', content: 'Write a short story' }
  ],
  model: 'gpt-4',
  stream: true
});

for await (const chunk of stream) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
  
  if (chunk.done) {
    console.log('\nUsage:', chunk.usage);
    break;
  }
}
```

### Custom Configuration

```typescript
import { AIGateway, ConfigManager } from '@deepwebai/ai-gateway';

const config = new ConfigManager({
  providers: {
    openai: {
      apiKey: 'your-key',
      timeout: 30000,
      retryAttempts: 3
    },
    anthropic: {
      apiKey: 'your-key',
      timeout: 45000
    }
  },
  defaultProvider: 'openai',
  fallbackProviders: ['anthropic'],
  globalSettings: {
    timeout: 30000,
    retryAttempts: 3,
    enableMetrics: true,
    enableLogging: true
  }
});

const gateway = new AIGateway(config);
await gateway.initialize();
```

### Provider Preferences

```typescript
// Use specific provider
const response = await gateway.chat({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'claude-3-opus-20240229'
}, 'anthropic');

// Auto-fallback with multiple providers
const response = await gateway.chatWithAutoFallback({
  messages: [{ role: 'user', content: 'Hello' }],
  model: 'gpt-4'
});
```

### Advanced Configuration

```typescript
const request = {
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Explain quantum computing' }
  ],
  model: 'gpt-4',
  config: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    stopSequences: ['<END>'],
    presencePenalty: 0.1,
    frequencyPenalty: 0.1
  }
};

const response = await gateway.chat(request);
```

## Provider-Specific Features

### OpenAI
- Models: GPT-4, GPT-3.5 Turbo variants
- Streaming: ✅ Full support
- Function calling: ✅ (via model parameters)

### Anthropic Claude
- Models: Claude 3 (Opus, Sonnet, Haiku), Claude 2.x
- Streaming: ✅ Full support
- Large context windows: ✅ Up to 200K tokens

### Google Gemini
- Models: Gemini Pro, Gemini Pro Vision
- Streaming: ✅ Full support
- Multimodal: ✅ Vision support

### DeepSeek
- Models: DeepSeek Chat, DeepSeek Coder
- Streaming: ✅ Full support
- Competitive pricing: ✅

### Local Llama
- Models: Llama 2, Code Llama, Mistral variants
- Streaming: ✅ Full support
- Local deployment: ✅ No API costs
- Compatible with Ollama: ✅

## Monitoring and Metrics

```typescript
// Get provider health status
const health = await gateway.healthCheck();
console.log(health); // { openai: true, anthropic: true, ... }

// Get usage metrics
const metrics = gateway.getAllMetrics();
console.log(metrics.openai); 
// {
//   requestCount: 150,
//   errorCount: 2,
//   averageLatency: 1250,
//   tokensUsed: 45000,
//   lastRequestTime: 1699123456789
// }

// Get available providers
const providers = gateway.getAvailableProviders();
console.log(providers); // ['openai', 'anthropic', 'gemini']

// Find providers for specific model
const compatibleProviders = gateway.findProvidersForModel('gpt-4');
console.log(compatibleProviders); // ['openai']
```

## Error Handling

```typescript
import { ProviderError } from '@deepwebai/ai-gateway';

try {
  const response = await gateway.chat(request);
} catch (error) {
  if (error instanceof ProviderError) {
    console.log('Provider error:', {
      code: error.code,
      type: error.type,
      retryable: error.retryable,
      details: error.details
    });
  }
}
```

## Rate Limiting

The gateway includes built-in rate limiting per provider:

- **OpenAI**: 500 requests/minute, 90K tokens/minute
- **Anthropic**: 1000 requests/minute, 100K tokens/minute  
- **Gemini**: 300 requests/minute, 32K tokens/minute
- **DeepSeek**: 200 requests/minute, 50K tokens/minute
- **Local Llama**: 100 requests/minute, 10K tokens/minute

Rate limits are automatically enforced and will throw errors when exceeded.

## Supported Models

### OpenAI
- `gpt-4`, `gpt-4-turbo`, `gpt-4-vision-preview`
- `gpt-3.5-turbo`, `gpt-3.5-turbo-16k`

### Anthropic
- `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307`
- `claude-2.1`, `claude-2.0`, `claude-instant-1.2`

### Gemini
- `gemini-pro`, `gemini-pro-vision`, `gemini-1.5-pro`, `gemini-1.5-flash`

### DeepSeek
- `deepseek-chat`, `deepseek-coder`

### Local Llama
- `llama-2-7b-chat`, `llama-2-13b-chat`, `llama-2-70b-chat`
- `codellama-7b`, `codellama-13b`, `codellama-34b`
- `mistral-7b`, `mixtral-8x7b`

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check
```

## License

MIT
