/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Basic usage example for AI Gateway
import { AIGateway, ConfigManager } from '@deepwebai/ai-gateway';

async function basicExample() {
  // Initialize with environment variables
  const gateway = new AIGateway();
  await gateway.initialize();

  try {
    // Simple chat completion
    const response = await gateway.chat({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello! How are you today?' }
      ],
      model: 'gpt-4'
    });

    console.log('Response:', response.content);
    console.log('Tokens used:', response.usage.totalTokens);
  } catch (error) {
    console.error('Chat failed:', error);
  }
}

async function streamingExample() {
  const gateway = new AIGateway();
  await gateway.initialize();

  try {
    console.log('Streaming response:');
    const stream = gateway.chatStream({
      messages: [
        { role: 'user', content: 'Write a short poem about programming' }
      ],
      model: 'gpt-4'
    });

    for await (const chunk of stream) {
      if (chunk.content) {
        process.stdout.write(chunk.content);
      }
      
      if (chunk.done) {
        console.log('\n\nStream completed!');
        if (chunk.usage) {
          console.log('Total tokens:', chunk.usage.totalTokens);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

async function customConfigExample() {
  // Custom configuration
  const config = new ConfigManager({
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        timeout: 30000,
        retryAttempts: 3
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
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

  // Use with automatic fallback
  try {
    const response = await gateway.chatWithAutoFallback({
      messages: [
        { role: 'user', content: 'Explain quantum computing in simple terms' }
      ],
      model: 'gpt-4',
      config: {
        temperature: 0.7,
        maxTokens: 500
      }
    });

    console.log('Response:', response.content);
  } catch (error) {
    console.error('All providers failed:', error);
  }
}

async function monitoringExample() {
  const gateway = new AIGateway();
  await gateway.initialize();

  // Check health of all providers
  const health = await gateway.healthCheck();
  console.log('Provider health:', health);

  // Get usage metrics
  const metrics = gateway.getAllMetrics();
  console.log('Usage metrics:', metrics);

  // Get available providers
  const providers = gateway.getAvailableProviders();
  console.log('Available providers:', providers);

  // Find providers for specific model
  const compatibleProviders = gateway.findProvidersForModel('claude-3-opus-20240229');
  console.log('Providers for Claude:', compatibleProviders);
}

// Run examples
if (require.main === module) {
  console.log('Running AI Gateway examples...\n');
  
  basicExample()
    .then(() => streamingExample())
    .then(() => customConfigExample())
    .then(() => monitoringExample())
    .catch(console.error);
}
