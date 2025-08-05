import type { ProviderConfig, ProviderType } from '@deepwebai/shared-types';

export interface AIGatewayConfig {
  providers: Record<ProviderType, ProviderConfig>;
  defaultProvider: ProviderType;
  fallbackProviders: ProviderType[];
  globalSettings: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    enableMetrics: boolean;
    enableLogging: boolean;
  };
}

export class ConfigManager {
  private config: AIGatewayConfig;

  constructor(config?: Partial<AIGatewayConfig>) {
    this.config = {
      providers: {} as Record<ProviderType, ProviderConfig>,
      defaultProvider: 'openai',
      fallbackProviders: ['anthropic', 'gemini'],
      globalSettings: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableMetrics: true,
        enableLogging: true
      },
      ...config
    };
  }

  setProviderConfig(type: ProviderType, config: ProviderConfig): void {
    this.config.providers[type] = config;
  }

  getProviderConfig(type: ProviderType): ProviderConfig | undefined {
    return this.config.providers[type];
  }

  getAllProviderConfigs(): Record<ProviderType, ProviderConfig> {
    return { ...this.config.providers };
  }

  setDefaultProvider(type: ProviderType): void {
    this.config.defaultProvider = type;
  }

  getDefaultProvider(): ProviderType {
    return this.config.defaultProvider;
  }

  setFallbackProviders(providers: ProviderType[]): void {
    this.config.fallbackProviders = providers;
  }

  getFallbackProviders(): ProviderType[] {
    return [...this.config.fallbackProviders];
  }

  updateGlobalSettings(settings: Partial<AIGatewayConfig['globalSettings']>): void {
    this.config.globalSettings = {
      ...this.config.globalSettings,
      ...settings
    };
  }

  getGlobalSettings(): AIGatewayConfig['globalSettings'] {
    return { ...this.config.globalSettings };
  }

  getFullConfig(): AIGatewayConfig {
    return { ...this.config };
  }

  static fromEnvironment(): ConfigManager {
    const config: Partial<AIGatewayConfig> = {
      providers: {} as Record<ProviderType, ProviderConfig>
    };

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      config.providers!.openai = {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
        timeout: process.env.OPENAI_TIMEOUT ? parseInt(process.env.OPENAI_TIMEOUT) : undefined
      };
    }

    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      config.providers!.anthropic = {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
        timeout: process.env.ANTHROPIC_TIMEOUT ? parseInt(process.env.ANTHROPIC_TIMEOUT) : undefined
      };
    }

    // Gemini
    if (process.env.GOOGLE_AI_API_KEY) {
      config.providers!.gemini = {
        apiKey: process.env.GOOGLE_AI_API_KEY,
        timeout: process.env.GEMINI_TIMEOUT ? parseInt(process.env.GEMINI_TIMEOUT) : undefined
      };
    }

    // DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      config.providers!.deepseek = {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL,
        timeout: process.env.DEEPSEEK_TIMEOUT ? parseInt(process.env.DEEPSEEK_TIMEOUT) : undefined
      };
    }

    // Local Llama
    if (process.env.LOCAL_LLAMA_BASE_URL || process.env.OLLAMA_BASE_URL) {
      config.providers!['local-llama'] = {
        apiKey: process.env.LOCAL_LLAMA_API_KEY || '',
        baseUrl: process.env.LOCAL_LLAMA_BASE_URL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
        timeout: process.env.LOCAL_LLAMA_TIMEOUT ? parseInt(process.env.LOCAL_LLAMA_TIMEOUT) : 60000
      };
    }

    // Global settings
    if (process.env.AI_GATEWAY_DEFAULT_PROVIDER) {
      config.defaultProvider = process.env.AI_GATEWAY_DEFAULT_PROVIDER as ProviderType;
    }

    if (process.env.AI_GATEWAY_FALLBACK_PROVIDERS) {
      config.fallbackProviders = process.env.AI_GATEWAY_FALLBACK_PROVIDERS.split(',') as ProviderType[];
    }

    return new ConfigManager(config);
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (Object.keys(this.config.providers).length === 0) {
      errors.push('No providers configured');
    }

    if (!this.config.providers[this.config.defaultProvider]) {
      errors.push(`Default provider '${this.config.defaultProvider}' is not configured`);
    }

    for (const [type, config] of Object.entries(this.config.providers)) {
      if (!config.apiKey && type !== 'local-llama') {
        errors.push(`Provider '${type}' missing API key`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
