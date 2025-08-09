#!/usr/bin/env tsx
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


import { promises as fs } from 'fs';
import { join } from 'path';

interface ConfigBackup {
  timestamp: string;
  environment: string;
  version: string;
  configurations: {
    analytics: AnalyticsConfig;
    monitoring: MonitoringConfig;
    services: ServiceConfig;
    features: FeatureConfig;
    deployment: DeploymentConfig;
  };
}

interface AnalyticsConfig {
  providers: {
    vercel?: { enabled: boolean; config?: any };
    plausible?: { enabled: boolean; config?: any };
    googleAnalytics?: { enabled: boolean; config?: any };
    mixpanel?: { enabled: boolean; config?: any };
  };
  settings: {
    sampling: number;
    privacy: boolean;
    cookieConsent: boolean;
  };
}

interface MonitoringConfig {
  sentry: {
    enabled: boolean;
    dsn?: string;
    environment: string;
    sampleRate: number;
  };
  prometheus: {
    enabled: boolean;
    port: number;
    metrics: string[];
  };
  healthChecks: {
    enabled: boolean;
    interval: number;
    endpoints: string[];
  };
}

interface ServiceConfig {
  ably: {
    enabled: boolean;
    features: string[];
  };
  auth: {
    providers: string[];
    jwt: {
      expiresIn: string;
      refreshEnabled: boolean;
    };
  };
  ai: {
    providers: string[];
    defaultProvider: string;
    rateLimits: any;
  };
  storage: {
    provider: string;
    settings: any;
  };
}

interface FeatureConfig {
  flags: {
    [key: string]: {
      enabled: boolean;
      rollout: number;
      conditions?: any;
    };
  };
  experiments: any[];
}

interface DeploymentConfig {
  docker: {
    services: string[];
    networks: string[];
    volumes: string[];
  };
  kubernetes?: {
    namespaces: string[];
    deployments: string[];
  };
  ci: {
    triggers: string[];
    stages: string[];
  };
}

export class ConfigurationBackup {
  private outputDir: string;
  private environment: string;

  constructor(outputDir?: string, environment?: string) {
    this.outputDir = outputDir || join(process.cwd(), 'backups', 'config');
    this.environment = environment || process.env.NODE_ENV || 'development';
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(this.outputDir, `config-backup-${timestamp}.json`);
    
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      
      console.log(`🚀 Starting configuration backup for ${this.environment}...`);
      
      const backup: ConfigBackup = {
        timestamp: new Date().toISOString(),
        environment: this.environment,
        version: '1.0',
        configurations: {
          analytics: await this.backupAnalyticsConfig(),
          monitoring: await this.backupMonitoringConfig(),
          services: await this.backupServiceConfig(),
          features: await this.backupFeatureConfig(),
          deployment: await this.backupDeploymentConfig()
        }
      };
      
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      
      console.log(`✅ Configuration backup completed: ${backupFile}`);
      return backupFile;
      
    } catch (error) {
      console.error('❌ Configuration backup failed:', error);
      throw error;
    }
  }

  private async backupAnalyticsConfig(): Promise<AnalyticsConfig> {
    console.log('📊 Backing up analytics configuration...');
    
    try {
      // Read analytics configuration from frontend
      const analyticsFile = join(process.cwd(), 'packages/frontend/src/utils/analytics.ts');
      const analyticsContent = await fs.readFile(analyticsFile, 'utf-8');
      
      // Extract analytics providers from observability package
      const observabilityIndexFile = join(process.cwd(), 'packages/observability/analytics/index.ts');
      const observabilityContent = await fs.readFile(observabilityIndexFile, 'utf-8');
      
      return {
        providers: {
          vercel: {
            enabled: this.extractBooleanConfig(analyticsContent, 'vercel'),
            config: this.extractConfig(analyticsContent, 'vercel')
          },
          plausible: {
            enabled: this.extractBooleanConfig(analyticsContent, 'plausible'),
            config: this.extractConfig(analyticsContent, 'plausible')
          },
          googleAnalytics: {
            enabled: this.extractBooleanConfig(observabilityContent, 'googleAnalytics'),
            config: this.extractConfig(observabilityContent, 'googleAnalytics')
          },
          mixpanel: {
            enabled: this.extractBooleanConfig(observabilityContent, 'mixpanel'),
            config: this.extractConfig(observabilityContent, 'mixpanel')
          }
        },
        settings: {
          sampling: 1.0,
          privacy: true,
          cookieConsent: true
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not backup analytics config:', error);
      return {
        providers: {},
        settings: { sampling: 1.0, privacy: true, cookieConsent: true }
      };
    }
  }

  private async backupMonitoringConfig(): Promise<MonitoringConfig> {
    console.log('📊 Backing up monitoring configuration...');
    
    try {
      // Read Sentry configuration
      const sentryConfigFile = join(process.cwd(), 'sentry.config.ts');
      let sentryContent = '';
      try {
        sentryContent = await fs.readFile(sentryConfigFile, 'utf-8');
      } catch {
        // Sentry config not found
      }
      
      // Read monitoring configuration
      const monitoringFile = join(process.cwd(), 'packages/backend/src/monitoring.ts');
      let monitoringContent = '';
      try {
        monitoringContent = await fs.readFile(monitoringFile, 'utf-8');
      } catch {
        // Monitoring config not found
      }
      
      return {
        sentry: {
          enabled: sentryContent.length > 0,
          environment: this.environment,
          sampleRate: this.extractNumericConfig(sentryContent, 'sampleRate') || 1.0
        },
        prometheus: {
          enabled: monitoringContent.includes('prometheus'),
          port: this.extractNumericConfig(monitoringContent, 'port') || 9090,
          metrics: this.extractArrayConfig(monitoringContent, 'metrics') || []
        },
        healthChecks: {
          enabled: monitoringContent.includes('health'),
          interval: 30000,
          endpoints: ['/health', '/metrics']
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not backup monitoring config:', error);
      return {
        sentry: { enabled: false, environment: this.environment, sampleRate: 1.0 },
        prometheus: { enabled: false, port: 9090, metrics: [] },
        healthChecks: { enabled: false, interval: 30000, endpoints: [] }
      };
    }
  }

  private async backupServiceConfig(): Promise<ServiceConfig> {
    console.log('🔧 Backing up service configuration...');
    
    try {
      // Read backend configuration
      const elysiaConfigFile = join(process.cwd(), 'packages/backend/src/elysia.config.ts');
      const elysiaContent = await fs.readFile(elysiaConfigFile, 'utf-8');
      
      // Read Ably configuration
      const ablyIntegrationFile = join(process.cwd(), 'packages/backend/src/realtime/ably-integration.ts');
      let ablyContent = '';
      try {
        ablyContent = await fs.readFile(ablyIntegrationFile, 'utf-8');
      } catch {
        // Ably config not found
      }
      
      // Read auth configuration
      const authIndexFile = join(process.cwd(), 'packages/backend/src/auth/index.ts');
      let authContent = '';
      try {
        authContent = await fs.readFile(authIndexFile, 'utf-8');
      } catch {
        // Auth config not found
      }
      
      return {
        ably: {
          enabled: ablyContent.length > 0,
          features: this.extractArrayConfig(ablyContent, 'features') || ['realtime', 'notifications']
        },
        auth: {
          providers: this.extractArrayConfig(authContent, 'providers') || ['jwt', 'lucia'],
          jwt: {
            expiresIn: this.extractStringConfig(authContent, 'expiresIn') || '24h',
            refreshEnabled: this.extractBooleanConfig(authContent, 'refresh') || true
          }
        },
        ai: {
          providers: ['openai', 'anthropic', 'deepseek', 'gemini'],
          defaultProvider: 'openai',
          rateLimits: {
            requests: 100,
            tokens: 10000,
            window: 3600
          }
        },
        storage: {
          provider: 'minio',
          settings: {
            bucket: 'deepwebai-files',
            region: 'us-east-1'
          }
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not backup service config:', error);
      return {
        ably: { enabled: false, features: [] },
        auth: { providers: [], jwt: { expiresIn: '24h', refreshEnabled: true } },
        ai: { providers: [], defaultProvider: 'openai', rateLimits: {} },
        storage: { provider: 'local', settings: {} }
      };
    }
  }

  private async backupFeatureConfig(): Promise<FeatureConfig> {
    console.log('🚩 Backing up feature configuration...');
    
    try {
      // Read feature flags configuration
      const featureFlagsFile = join(process.cwd(), 'packages/feature-flags/index.ts');
      const featureFlagsContent = await fs.readFile(featureFlagsFile, 'utf-8');
      
      const featureFlagsTypesFile = join(process.cwd(), 'packages/feature-flags/src/types.ts');
      const featureFlagsTypesContent = await fs.readFile(featureFlagsTypesFile, 'utf-8');
      
      return {
        flags: this.extractFeatureFlags(featureFlagsContent),
        experiments: []
      };
    } catch (error) {
      console.warn('⚠️ Could not backup feature config:', error);
      return {
        flags: {},
        experiments: []
      };
    }
  }

  private async backupDeploymentConfig(): Promise<DeploymentConfig> {
    console.log('🚀 Backing up deployment configuration...');
    
    try {
      // Read Docker configuration
      const dockerComposeFile = join(process.cwd(), 'docker/docker-compose.yml');
      let dockerContent = '';
      try {
        dockerContent = await fs.readFile(dockerComposeFile, 'utf-8');
      } catch {
        // Docker config not found
      }
      
      // Read CI/CD configuration
      const makefileFile = join(process.cwd(), 'Makefile');
      let makefileContent = '';
      try {
        makefileContent = await fs.readFile(makefileFile, 'utf-8');
      } catch {
        // Makefile not found
      }
      
      return {
        docker: {
          services: this.extractDockerServices(dockerContent),
          networks: this.extractDockerNetworks(dockerContent),
          volumes: this.extractDockerVolumes(dockerContent)
        },
        ci: {
          triggers: ['push', 'pull_request'],
          stages: ['build', 'test', 'deploy']
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not backup deployment config:', error);
      return {
        docker: { services: [], networks: [], volumes: [] },
        ci: { triggers: [], stages: [] }
      };
    }
  }

  // Helper methods for extracting configuration values
  private extractBooleanConfig(content: string, key: string): boolean {
    const regex = new RegExp(`${key}.*?:.*?(true|false)`, 'i');
    const match = content.match(regex);
    return match ? match[1] === 'true' : false;
  }

  private extractNumericConfig(content: string, key: string): number | null {
    const regex = new RegExp(`${key}.*?:.*?(\\d+)`, 'i');
    const match = content.match(regex);
    return match ? parseInt(match[1], 10) : null;
  }

  private extractStringConfig(content: string, key: string): string | null {
    const regex = new RegExp(`${key}.*?:.*?['"]([^'"]+)['"]`, 'i');
    const match = content.match(regex);
    return match ? match[1] : null;
  }

  private extractArrayConfig(content: string, key: string): string[] | null {
    const regex = new RegExp(`${key}.*?:\\s*\\[([^\\]]+)\\]`, 'i');
    const match = content.match(regex);
    if (match) {
      return match[1].split(',').map(item => item.trim().replace(/['"]/g, ''));
    }
    return null;
  }

  private extractConfig(content: string, key: string): any {
    const regex = new RegExp(`${key}.*?:\\s*\\{([^}]+)\\}`, 'i');
    const match = content.match(regex);
    if (match) {
      try {
        return JSON.parse(`{${match[1]}}`);
      } catch {
        return { raw: match[1] };
      }
    }
    return null;
  }

  private extractFeatureFlags(content: string): { [key: string]: any } {
    const flags: { [key: string]: any } = {};
    
    // Extract feature flag definitions
    const flagRegex = /(\w+):\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = flagRegex.exec(content)) !== null) {
      const flagName = match[1];
      const flagConfig = match[2];
      
      flags[flagName] = {
        enabled: this.extractBooleanConfig(flagConfig, 'enabled'),
        rollout: this.extractNumericConfig(flagConfig, 'rollout') || 0,
        conditions: this.extractConfig(flagConfig, 'conditions')
      };
    }
    
    return flags;
  }

  private extractDockerServices(content: string): string[] {
    const services: string[] = [];
    const serviceRegex = /^\s+(\w+):/gm;
    let match;
    
    while ((match = serviceRegex.exec(content)) !== null) {
      if (match[1] !== 'version' && match[1] !== 'services') {
        services.push(match[1]);
      }
    }
    
    return services;
  }

  private extractDockerNetworks(content: string): string[] {
    const networks: string[] = [];
    const networksSection = content.match(/networks:\s*([\s\S]*?)(?=volumes:|$)/);
    
    if (networksSection) {
      const networkRegex = /^\s+(\w+):/gm;
      let match;
      
      while ((match = networkRegex.exec(networksSection[1])) !== null) {
        networks.push(match[1]);
      }
    }
    
    return networks;
  }

  private extractDockerVolumes(content: string): string[] {
    const volumes: string[] = [];
    const volumesSection = content.match(/volumes:\s*([\s\S]*?)$/);
    
    if (volumesSection) {
      const volumeRegex = /^\s+(\w+):/gm;
      let match;
      
      while ((match = volumeRegex.exec(volumesSection[1])) !== null) {
        volumes.push(match[1]);
      }
    }
    
    return volumes;
  }

  async restoreBackup(backupFile: string): Promise<void> {
    try {
      console.log(`🔄 Restoring configuration from ${backupFile}...`);
      
      const backupContent = await fs.readFile(backupFile, 'utf-8');
      const backup: ConfigBackup = JSON.parse(backupContent);
      
      console.log(`📊 Restoring configuration for ${backup.environment} (${backup.timestamp})`);
      
      // Note: This is a read-only backup for safety
      // Actual restoration would require careful implementation
      // to avoid overwriting current configurations
      
      console.log('ℹ️ Configuration restoration requires manual review and implementation');
      console.log('📋 Backup contains:');
      console.log(`  - Analytics: ${Object.keys(backup.configurations.analytics.providers).length} providers`);
      console.log(`  - Features: ${Object.keys(backup.configurations.features.flags).length} flags`);
      console.log(`  - Services: ${Object.keys(backup.configurations.services).length} service configs`);
      console.log(`  - Docker: ${backup.configurations.deployment.docker.services.length} services`);
      
    } catch (error) {
      console.error('❌ Configuration restore failed:', error);
      throw error;
    }
  }

  async compareConfigurations(backup1: string, backup2: string): Promise<void> {
    try {
      console.log(`🔍 Comparing configurations...`);
      
      const config1: ConfigBackup = JSON.parse(await fs.readFile(backup1, 'utf-8'));
      const config2: ConfigBackup = JSON.parse(await fs.readFile(backup2, 'utf-8'));
      
      console.log(`\n📊 Comparing ${config1.environment} (${config1.timestamp}) vs ${config2.environment} (${config2.timestamp})`);
      
      // Compare feature flags
      this.compareFeatureFlags(config1.configurations.features.flags, config2.configurations.features.flags);
      
      // Compare analytics
      this.compareAnalytics(config1.configurations.analytics, config2.configurations.analytics);
      
      // Compare services
      this.compareServices(config1.configurations.services, config2.configurations.services);
      
    } catch (error) {
      console.error('❌ Configuration comparison failed:', error);
      throw error;
    }
  }

  private compareFeatureFlags(flags1: any, flags2: any): void {
    console.log('\n🚩 Feature Flags Comparison:');
    
    const keys1 = new Set(Object.keys(flags1));
    const keys2 = new Set(Object.keys(flags2));
    
    const onlyIn1 = [...keys1].filter(k => !keys2.has(k));
    const onlyIn2 = [...keys2].filter(k => !keys1.has(k));
    const common = [...keys1].filter(k => keys2.has(k));
    
    if (onlyIn1.length > 0) {
      console.log(`  Only in first: ${onlyIn1.join(', ')}`);
    }
    
    if (onlyIn2.length > 0) {
      console.log(`  Only in second: ${onlyIn2.join(', ')}`);
    }
    
    const different = common.filter(k => {
      const f1 = flags1[k];
      const f2 = flags2[k];
      return f1.enabled !== f2.enabled || f1.rollout !== f2.rollout;
    });
    
    if (different.length > 0) {
      console.log(`  Different settings: ${different.join(', ')}`);
    }
  }

  private compareAnalytics(analytics1: AnalyticsConfig, analytics2: AnalyticsConfig): void {
    console.log('\n📊 Analytics Comparison:');
    
    const providers1 = Object.keys(analytics1.providers);
    const providers2 = Object.keys(analytics2.providers);
    
    console.log(`  Providers: ${providers1.join(', ')} vs ${providers2.join(', ')}`);
  }

  private compareServices(services1: ServiceConfig, services2: ServiceConfig): void {
    console.log('\n🔧 Services Comparison:');
    
    console.log(`  Ably: ${services1.ably.enabled} vs ${services2.ably.enabled}`);
    console.log(`  Auth providers: ${services1.auth.providers.join(', ')} vs ${services2.auth.providers.join(', ')}`);
    console.log(`  AI providers: ${services1.ai.providers.join(', ')} vs ${services2.ai.providers.join(', ')}`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'backup';
  const environment = args[1] || process.env.NODE_ENV || 'development';
  
  const backup = new ConfigurationBackup();
  
  try {
    switch (action) {
      case 'backup':
        await backup.createBackup();
        break;
      case 'restore':
        const backupFile = args[2];
        if (!backupFile) {
          console.error('❌ Please provide backup file path');
          process.exit(1);
        }
        await backup.restoreBackup(backupFile);
        break;
      case 'compare':
        const backup1 = args[2];
        const backup2 = args[3];
        if (!backup1 || !backup2) {
          console.error('❌ Please provide two backup files for comparison');
          process.exit(1);
        }
        await backup.compareConfigurations(backup1, backup2);
        break;
      default:
        console.log('Usage: tsx config-backup.ts [action] [environment] [args]');
        console.log('Actions: backup, restore, compare');
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
