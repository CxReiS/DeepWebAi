import { describe, it, expect, beforeEach } from 'vitest';
import { AIGateway, ConfigManager } from '../index';

describe('AI Gateway', () => {
  let gateway: AIGateway;
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager({
      providers: {
        'local-llama': {
          apiKey: '',
          baseUrl: 'http://localhost:11434/v1',
          timeout: 30000
        }
      },
      defaultProvider: 'local-llama',
      fallbackProviders: []
    });
    
    gateway = new AIGateway(configManager);
  });

  it('should initialize without errors', async () => {
    expect(() => gateway).not.toThrow();
  });

  it('should validate configuration', () => {
    const validation = configManager.validateConfig();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should get supported models', () => {
    const models = gateway.getSupportedModels();
    expect(models).toBeDefined();
    expect(typeof models).toBe('object');
  });

  it('should find providers for model', () => {
    const providers = gateway.findProvidersForModel('llama-2-7b-chat');
    expect(Array.isArray(providers)).toBe(true);
  });

  it('should create config from environment', () => {
    const envConfig = ConfigManager.fromEnvironment();
    expect(envConfig).toBeDefined();
    expect(envConfig.getFullConfig()).toBeDefined();
  });

  it('should get available providers before initialization', () => {
    const providers = gateway.getAvailableProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  it('should get metrics for all providers', () => {
    const metrics = gateway.getAllMetrics();
    expect(typeof metrics).toBe('object');
  });
});

describe('ConfigManager', () => {
  it('should create default config', () => {
    const config = new ConfigManager();
    expect(config.getDefaultProvider()).toBe('openai');
    expect(config.getFallbackProviders()).toContain('anthropic');
  });

  it('should set and get provider config', () => {
    const config = new ConfigManager();
    const providerConfig = {
      apiKey: 'test-key',
      timeout: 30000
    };
    
    config.setProviderConfig('openai', providerConfig);
    const retrieved = config.getProviderConfig('openai');
    
    expect(retrieved).toEqual(providerConfig);
  });

  it('should update global settings', () => {
    const config = new ConfigManager();
    config.updateGlobalSettings({ timeout: 60000 });
    
    const settings = config.getGlobalSettings();
    expect(settings.timeout).toBe(60000);
  });
});
