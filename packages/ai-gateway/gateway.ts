import type { 
  ProviderType, 
  AIRequest, 
  AIResponse, 
  StreamChunk,
  ProviderMetrics 
} from '@deepwebai/shared-types';

import { AIProviderRegistry } from './core/provider-registry';
import { ConfigManager } from './config-manager';
import { OpenAIProvider } from './providers/openai/client';
import { AnthropicProvider } from './providers/anthropic/client';
import { GeminiProvider } from './providers/gemini/client';
import { DeepSeekProvider } from './providers/deepseek/client';
import { LocalLlamaProvider } from './providers/local-llama/client';

export class AIGateway {
  private registry: AIProviderRegistry;
  private configManager: ConfigManager;
  private initialized = false;

  constructor(configManager?: ConfigManager) {
    this.configManager = configManager || ConfigManager.fromEnvironment();
    this.registry = new AIProviderRegistry();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const validation = this.configManager.validateConfig();
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    const configs = this.configManager.getAllProviderConfigs();

    // Register and initialize all configured providers
    const providers = [
      new OpenAIProvider(),
      new AnthropicProvider(),
      new GeminiProvider(),
      new DeepSeekProvider(),
      new LocalLlamaProvider()
    ];

    for (const provider of providers) {
      const config = configs[provider.type];
      if (config) {
        try {
          await provider.initialize(config);
          this.registry.register(provider);
          // Provider initialized successfully
        } catch (error) {
          console.warn(`✗ Failed to initialize ${provider.name}:`, error);
        }
      }
    }

    this.initialized = true;
    // AI Gateway initialization complete
  }

  async chat(request: AIRequest, preferredProvider?: ProviderType): Promise<AIResponse> {
    await this.ensureInitialized();

    const providers = this.getProviderPriority(preferredProvider, request.model);
    const { provider } = await this.registry.getProviderWithFallback(providers, request.model);

    this.registry.getRateLimiter().recordRequest(provider.type);
    return provider.chat(request);
  }

  async *chatStream(request: AIRequest, preferredProvider?: ProviderType): AsyncGenerator<StreamChunk, void, unknown> {
    await this.ensureInitialized();

    const providers = this.getProviderPriority(preferredProvider, request.model);
    const { provider } = await this.registry.getProviderWithFallback(providers, request.model);

    if (!provider.supportsStreaming) {
      throw new Error(`Provider ${provider.type} does not support streaming`);
    }

    this.registry.getRateLimiter().recordRequest(provider.type);
    yield* provider.chatStream(request);
  }

  async chatWithAutoFallback(request: AIRequest, preferredProvider?: ProviderType): Promise<AIResponse> {
    const providers = this.getProviderPriority(preferredProvider, request.model);
    
    for (const providerType of providers) {
      try {
        return await this.chat(request, providerType);
      } catch (error) {
        console.warn(`Provider ${providerType} failed, trying next:`, error);
        continue;
      }
    }
    
    throw new Error(`All providers failed for model: ${request.model}`);
  }

  getAvailableProviders(): ProviderType[] {
    return this.registry.listProviders();
  }

  getProviderMetrics(type: ProviderType): ProviderMetrics | undefined {
    const provider = this.registry.getProvider(type);
    return provider?.getMetrics();
  }

  getAllMetrics(): Record<ProviderType, ProviderMetrics> {
    const metrics: Record<string, ProviderMetrics> = {};
    
    for (const type of this.registry.listProviders()) {
      const provider = this.registry.getProvider(type);
      if (provider) {
        metrics[type] = provider.getMetrics();
      }
    }
    
    return metrics as Record<ProviderType, ProviderMetrics>;
  }

  async healthCheck(): Promise<Record<ProviderType, boolean>> {
    const health: Record<string, boolean> = {};
    
    const healthChecks = this.registry.listProviders().map(async (type) => {
      const provider = this.registry.getProvider(type);
      if (provider) {
        try {
          health[type] = await provider.isHealthy();
        } catch {
          health[type] = false;
        }
      }
    });

    await Promise.allSettled(healthChecks);
    return health as Record<ProviderType, boolean>;
  }

  getSupportedModels(type?: ProviderType): Record<ProviderType, string[]> | string[] {
    if (type) {
      const provider = this.registry.getProvider(type);
      return provider?.supportedModels || [];
    }

    const models: Record<string, string[]> = {};
    for (const providerType of this.registry.listProviders()) {
      const provider = this.registry.getProvider(providerType);
      if (provider) {
        models[providerType] = provider.supportedModels;
      }
    }
    
    return models as Record<ProviderType, string[]>;
  }

  findProvidersForModel(model: string): ProviderType[] {
    const compatibleProviders: ProviderType[] = [];
    
    for (const type of this.registry.listProviders()) {
      const provider = this.registry.getProvider(type);
      if (provider?.validateModel(model)) {
        compatibleProviders.push(type);
      }
    }
    
    return compatibleProviders;
  }

  getConfig(): any {
    return this.configManager.getFullConfig();
  }

  updateProviderConfig(type: ProviderType, config: any): void {
    this.configManager.setProviderConfig(type, config);
    this.initialized = false; // Force re-initialization
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private getProviderPriority(preferredProvider?: ProviderType, model?: string): ProviderType[] {
    const providers: ProviderType[] = [];
    
    // Add preferred provider first
    if (preferredProvider && this.registry.isProviderAvailable(preferredProvider)) {
      providers.push(preferredProvider);
    }
    
    // Add providers that support the specific model
    if (model) {
      const compatibleProviders = this.findProvidersForModel(model);
      for (const type of compatibleProviders) {
        if (!providers.includes(type)) {
          providers.push(type);
        }
      }
    }
    
    // Add default provider
    const defaultProvider = this.configManager.getDefaultProvider();
    if (!providers.includes(defaultProvider) && this.registry.isProviderAvailable(defaultProvider)) {
      providers.push(defaultProvider);
    }
    
    // Add fallback providers
    for (const type of this.configManager.getFallbackProviders()) {
      if (!providers.includes(type) && this.registry.isProviderAvailable(type)) {
        providers.push(type);
      }
    }
    
    return providers;
  }
}

// Export singleton instance for convenience
export const gateway = new AIGateway();
