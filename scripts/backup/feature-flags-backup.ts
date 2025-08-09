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


import { createNeonClient } from '../../database/neon-config';
import { promises as fs } from 'fs';
import { join } from 'path';

interface FeatureFlagBackup {
  timestamp: string;
  environment: string;
  flags: FeatureFlagEntry[];
  analytics: AnalyticsConfig[];
  configurations: ConfigurationEntry[];
}

interface FeatureFlagEntry {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  conditions?: any;
  rolloutPercentage?: number;
  targetUsers?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AnalyticsConfig {
  provider: string;
  enabled: boolean;
  config: any;
  environment: string;
}

interface ConfigurationEntry {
  key: string;
  value: any;
  environment: string;
  encrypted: boolean;
  category: string;
}

export class FeatureFlagsBackup {
  private sql = createNeonClient();
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir || join(process.cwd(), 'backups', 'feature-flags');
  }

  async createBackup(environment: string = 'all'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = join(this.outputDir, `feature-flags-backup-${timestamp}.json`);
    
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      
      console.log(`🚀 Starting feature flags backup for ${environment}...`);
      
      const backup: FeatureFlagBackup = {
        timestamp: new Date().toISOString(),
        environment,
        flags: await this.getFeatureFlags(environment),
        analytics: await this.getAnalyticsConfig(environment),
        configurations: await this.getConfigurations(environment)
      };
      
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      
      console.log(`✅ Feature flags backup completed: ${backupFile}`);
      console.log(`📊 Backed up ${backup.flags.length} feature flags`);
      console.log(`📊 Backed up ${backup.analytics.length} analytics configs`);
      console.log(`📊 Backed up ${backup.configurations.length} configurations`);
      
      return backupFile;
      
    } catch (error) {
      console.error('❌ Feature flags backup failed:', error);
      throw error;
    }
  }

  private async getFeatureFlags(environment: string): Promise<FeatureFlagEntry[]> {
    try {
      let query;
      if (environment === 'all') {
        query = this.sql`
          SELECT 
            id,
            name,
            description,
            enabled,
            conditions,
            rollout_percentage as "rolloutPercentage",
            target_users as "targetUsers",
            created_at as "createdAt",
            updated_at as "updatedAt",
            environment
          FROM feature_flags 
          ORDER BY name, environment
        `;
      } else {
        query = this.sql`
          SELECT 
            id,
            name,
            description,
            enabled,
            conditions,
            rollout_percentage as "rolloutPercentage",
            target_users as "targetUsers",
            created_at as "createdAt",
            updated_at as "updatedAt",
            environment
          FROM feature_flags 
          WHERE environment = ${environment}
          ORDER BY name
        `;
      }
      
      const result = await query;
      return result as FeatureFlagEntry[];
    } catch (error) {
      console.warn('⚠️ Feature flags table not found, creating empty backup');
      return [];
    }
  }

  private async getAnalyticsConfig(environment: string): Promise<AnalyticsConfig[]> {
    try {
      let query;
      if (environment === 'all') {
        query = this.sql`
          SELECT 
            provider,
            enabled,
            config,
            environment
          FROM analytics_config 
          ORDER BY provider, environment
        `;
      } else {
        query = this.sql`
          SELECT 
            provider,
            enabled,
            config,
            environment
          FROM analytics_config 
          WHERE environment = ${environment}
          ORDER BY provider
        `;
      }
      
      const result = await query;
      return result as AnalyticsConfig[];
    } catch (error) {
      console.warn('⚠️ Analytics config table not found, creating empty backup');
      return [];
    }
  }

  private async getConfigurations(environment: string): Promise<ConfigurationEntry[]> {
    try {
      let query;
      if (environment === 'all') {
        query = this.sql`
          SELECT 
            key,
            value,
            environment,
            encrypted,
            category
          FROM app_configurations 
          WHERE encrypted = false  -- Don't backup encrypted values
          ORDER BY category, key, environment
        `;
      } else {
        query = this.sql`
          SELECT 
            key,
            value,
            environment,
            encrypted,
            category
          FROM app_configurations 
          WHERE environment = ${environment} AND encrypted = false
          ORDER BY category, key
        `;
      }
      
      const result = await query;
      return result as ConfigurationEntry[];
    } catch (error) {
      console.warn('⚠️ App configurations table not found, creating empty backup');
      return [];
    }
  }

  async restoreBackup(backupFile: string, targetEnvironment?: string): Promise<void> {
    try {
      console.log(`🔄 Restoring feature flags from ${backupFile}...`);
      
      const backupContent = await fs.readFile(backupFile, 'utf-8');
      const backup: FeatureFlagBackup = JSON.parse(backupContent);
      
      const environment = targetEnvironment || backup.environment;
      
      // Restore feature flags
      await this.restoreFeatureFlags(backup.flags, environment);
      
      // Restore analytics config
      await this.restoreAnalyticsConfig(backup.analytics, environment);
      
      // Restore configurations
      await this.restoreConfigurations(backup.configurations, environment);
      
      console.log(`✅ Feature flags restore completed for ${environment}`);
      
    } catch (error) {
      console.error('❌ Feature flags restore failed:', error);
      throw error;
    }
  }

  private async restoreFeatureFlags(flags: FeatureFlagEntry[], environment: string): Promise<void> {
    if (flags.length === 0) return;
    
    try {
      // Create table if it doesn't exist
      await this.sql`
        CREATE TABLE IF NOT EXISTS feature_flags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          enabled BOOLEAN DEFAULT false,
          conditions JSONB,
          rollout_percentage INTEGER DEFAULT 0,
          target_users TEXT[],
          environment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(name, environment)
        )
      `;
      
      for (const flag of flags) {
        await this.sql`
          INSERT INTO feature_flags (
            id, name, description, enabled, conditions, 
            rollout_percentage, target_users, environment, 
            created_at, updated_at
          ) VALUES (
            ${flag.id}, ${flag.name}, ${flag.description}, ${flag.enabled}, 
            ${flag.conditions}, ${flag.rolloutPercentage}, ${flag.targetUsers}, 
            ${environment}, ${flag.createdAt}, ${flag.updatedAt}
          )
          ON CONFLICT (name, environment) 
          DO UPDATE SET
            description = EXCLUDED.description,
            enabled = EXCLUDED.enabled,
            conditions = EXCLUDED.conditions,
            rollout_percentage = EXCLUDED.rollout_percentage,
            target_users = EXCLUDED.target_users,
            updated_at = NOW()
        `;
      }
      
      console.log(`✅ Restored ${flags.length} feature flags`);
    } catch (error) {
      console.error('❌ Failed to restore feature flags:', error);
      throw error;
    }
  }

  private async restoreAnalyticsConfig(configs: AnalyticsConfig[], environment: string): Promise<void> {
    if (configs.length === 0) return;
    
    try {
      // Create table if it doesn't exist
      await this.sql`
        CREATE TABLE IF NOT EXISTS analytics_config (
          provider TEXT NOT NULL,
          enabled BOOLEAN DEFAULT false,
          config JSONB,
          environment TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY(provider, environment)
        )
      `;
      
      for (const config of configs) {
        await this.sql`
          INSERT INTO analytics_config (provider, enabled, config, environment)
          VALUES (${config.provider}, ${config.enabled}, ${config.config}, ${environment})
          ON CONFLICT (provider, environment)
          DO UPDATE SET
            enabled = EXCLUDED.enabled,
            config = EXCLUDED.config,
            updated_at = NOW()
        `;
      }
      
      console.log(`✅ Restored ${configs.length} analytics configurations`);
    } catch (error) {
      console.error('❌ Failed to restore analytics config:', error);
      throw error;
    }
  }

  private async restoreConfigurations(configs: ConfigurationEntry[], environment: string): Promise<void> {
    if (configs.length === 0) return;
    
    try {
      // Create table if it doesn't exist
      await this.sql`
        CREATE TABLE IF NOT EXISTS app_configurations (
          key TEXT NOT NULL,
          value JSONB,
          environment TEXT NOT NULL,
          encrypted BOOLEAN DEFAULT false,
          category TEXT DEFAULT 'general',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY(key, environment)
        )
      `;
      
      for (const config of configs) {
        await this.sql`
          INSERT INTO app_configurations (key, value, environment, encrypted, category)
          VALUES (${config.key}, ${config.value}, ${environment}, ${config.encrypted}, ${config.category})
          ON CONFLICT (key, environment)
          DO UPDATE SET
            value = EXCLUDED.value,
            category = EXCLUDED.category,
            updated_at = NOW()
        `;
      }
      
      console.log(`✅ Restored ${configs.length} app configurations`);
    } catch (error) {
      console.error('❌ Failed to restore app configurations:', error);
      throw error;
    }
  }

  async compareEnvironments(env1: string, env2: string): Promise<void> {
    try {
      console.log(`🔍 Comparing feature flags between ${env1} and ${env2}...`);
      
      const flags1 = await this.getFeatureFlags(env1);
      const flags2 = await this.getFeatureFlags(env2);
      
      const flags1Map = new Map(flags1.map(f => [f.name, f]));
      const flags2Map = new Map(flags2.map(f => [f.name, f]));
      
      // Find differences
      const onlyIn1 = flags1.filter(f => !flags2Map.has(f.name));
      const onlyIn2 = flags2.filter(f => !flags1Map.has(f.name));
      const different = flags1.filter(f => {
        const other = flags2Map.get(f.name);
        return other && (f.enabled !== other.enabled || f.rolloutPercentage !== other.rolloutPercentage);
      });
      
      console.log(`\n📊 Comparison Results:`);
      console.log(`Flags only in ${env1}: ${onlyIn1.length}`);
      console.log(`Flags only in ${env2}: ${onlyIn2.length}`);
      console.log(`Flags with different settings: ${different.length}`);
      
      if (onlyIn1.length > 0) {
        console.log(`\n🔵 Only in ${env1}:`);
        onlyIn1.forEach(f => console.log(`  - ${f.name} (${f.enabled ? 'enabled' : 'disabled'})`));
      }
      
      if (onlyIn2.length > 0) {
        console.log(`\n🟡 Only in ${env2}:`);
        onlyIn2.forEach(f => console.log(`  - ${f.name} (${f.enabled ? 'enabled' : 'disabled'})`));
      }
      
      if (different.length > 0) {
        console.log(`\n🔴 Different settings:`);
        different.forEach(f => {
          const other = flags2Map.get(f.name)!;
          console.log(`  - ${f.name}: ${env1}(${f.enabled}/${f.rolloutPercentage}%) vs ${env2}(${other.enabled}/${other.rolloutPercentage}%)`);
        });
      }
      
    } catch (error) {
      console.error('❌ Comparison failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'backup';
  const environment = args[1] || 'development';
  
  const backup = new FeatureFlagsBackup();
  
  try {
    switch (action) {
      case 'backup':
        await backup.createBackup(environment);
        break;
      case 'restore':
        const backupFile = args[2];
        if (!backupFile) {
          console.error('❌ Please provide backup file path');
          process.exit(1);
        }
        await backup.restoreBackup(backupFile, environment);
        break;
      case 'compare':
        const env2 = args[2];
        if (!env2) {
          console.error('❌ Please provide second environment for comparison');
          process.exit(1);
        }
        await backup.compareEnvironments(environment, env2);
        break;
      default:
        console.log('Usage: tsx feature-flags-backup.ts [action] [environment] [args]');
        console.log('Actions: backup, restore, compare');
        console.log('Environments: development, staging, production, all');
    }
  } catch (error) {
    console.error('❌ Operation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
