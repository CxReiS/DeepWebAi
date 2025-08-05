// Type definition for Pool to avoid dependency on pg package
interface Pool {
  connect(): Promise<any>;
  end(): Promise<void>;
}

import { FeatureFlagProvider, UserContext, FeatureFlagConfig } from './types';

export class DatabaseFeatureFlagProvider implements FeatureFlagProvider {
  private pool: Pool;
  private config: FeatureFlagConfig;
  private cache = new Map<string, { value: any; timestamp: number }>();

  constructor(config: FeatureFlagConfig) {
    this.config = config;
    // In a real implementation, this would be: new Pool({ connectionString: config.databaseUrl })
    this.pool = {} as Pool;
  }

  async initialize(): Promise<void> {
    try {
      // Test database connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      // Database connection verified
    } catch (error) {
      console.error('Failed to initialize database feature flag provider:', error);
      throw error;
    }
  }

  async isFeatureEnabled(flagName: string, userContext: UserContext): Promise<boolean> {
    const cacheKey = `${flagName}:${userContext.id}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout * 1000) {
      return cached.value;
    }

    try {
      const client = await this.pool.connect();
      
      const result = await client.query(
        'SELECT evaluate_feature_flag($1, $2, $3) as is_enabled',
        [flagName, userContext.id, this.config.environment]
      );
      
      client.release();
      
      const isEnabled = result.rows[0]?.is_enabled || false;
      
      // Cache result
      this.cache.set(cacheKey, { value: isEnabled, timestamp: Date.now() });
      
      return isEnabled;
    } catch (error) {
      console.error(`Error evaluating feature flag ${flagName}:`, error);
      return false;
    }
  }

  async getAllFeatures(userContext: UserContext): Promise<Record<string, boolean>> {
    try {
      const client = await this.pool.connect();
      
      const result = await client.query(
        'SELECT * FROM get_user_feature_flags($1, $2)',
        [userContext.id, this.config.environment]
      );
      
      client.release();
      
      const features: Record<string, boolean> = {};
      result.rows.forEach((row: any) => {
        features[row.flag_name] = row.is_enabled;
      });
      
      return features;
    } catch (error) {
      console.error('Error getting all features:', error);
      return {};
    }
  }

  async getFeatureValue<T>(
    flagName: string, 
    userContext: UserContext, 
    defaultValue: T
  ): Promise<T> {
    // For database provider, we only support boolean flags
    const isEnabled = await this.isFeatureEnabled(flagName, userContext);
    return (isEnabled as unknown as T) || defaultValue;
  }

  async trackEvent(
    eventName: string, 
    userContext: UserContext, 
    properties?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enableAnalytics) return;

    try {
      const client = await this.pool.connect();
      
      await client.query(
        `INSERT INTO feature_flag_analytics (feature_flag_id, user_id, event_type, event_data)
         SELECT ff.id, $2, $3, $4
         FROM feature_flags ff 
         WHERE ff.name = $1`,
        [eventName, userContext.id, 'custom_event', JSON.stringify(properties || {})]
      );
      
      client.release();
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  async createFeatureFlag(flag: {
    name: string;
    description?: string;
    isEnabled: boolean;
    rolloutPercentage?: number;
    environment?: string;
    targetGroups?: string[];
    conditions?: Record<string, any>;
  }): Promise<void> {
    try {
      const client = await this.pool.connect();
      
      await client.query(
        `INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage, environment, target_groups, conditions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          flag.name,
          flag.description,
          flag.isEnabled,
          flag.rolloutPercentage || 0,
          flag.environment || 'all',
          JSON.stringify(flag.targetGroups || []),
          JSON.stringify(flag.conditions || {})
        ]
      );
      
      client.release();
      
      // Clear cache for this flag
      this.clearCacheForFlag(flag.name);
    } catch (error) {
      console.error('Error creating feature flag:', error);
      throw error;
    }
  }

  async updateFeatureFlag(name: string, updates: Partial<{
    description: string;
    isEnabled: boolean;
    rolloutPercentage: number;
    environment: string;
    targetGroups: string[];
    conditions: Record<string, any>;
  }>): Promise<void> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        const columnMap: Record<string, string> = {
          description: 'description',
          isEnabled: 'is_enabled',
          rolloutPercentage: 'rollout_percentage',
          environment: 'environment',
          targetGroups: 'target_groups',
          conditions: 'conditions'
        };

        const column = columnMap[key];
        if (column) {
          setParts.push(`${column} = $${paramIndex++}`);
          if (key === 'targetGroups' || key === 'conditions') {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      });

      if (setParts.length === 0) return;

      const client = await this.pool.connect();
      
      await client.query(
        `UPDATE feature_flags SET ${setParts.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE name = $${paramIndex}`,
        [...values, name]
      );
      
      client.release();
      
      // Clear cache for this flag
      this.clearCacheForFlag(name);
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  private clearCacheForFlag(flagName: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${flagName}:`)) {
        this.cache.delete(key);
      }
    }
  }

  async destroy(): Promise<void> {
    await this.pool.end();
    this.cache.clear();
  }
}
