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

import type { ProviderRegistry, AIProvider, ProviderType, RateLimiter } from '@deepwebai/shared-types';
import { TokenBucketRateLimiter } from './rate-limiter';

export class AIProviderRegistry implements ProviderRegistry {
  private providers = new Map<ProviderType, AIProvider>();
  private rateLimiter: RateLimiter;

  constructor(rateLimiter?: RateLimiter) {
    this.rateLimiter = rateLimiter || new TokenBucketRateLimiter();
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.type, provider);
  }

  getProvider(type: ProviderType): AIProvider | undefined {
    return this.providers.get(type);
  }

  listProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  isProviderAvailable(type: ProviderType): boolean {
    const provider = this.providers.get(type);
    return provider !== undefined;
  }

  async getAvailableProvider(type: ProviderType): Promise<AIProvider> {
    const provider = this.getProvider(type);
    if (!provider) {
      throw new Error(`Provider ${type} not registered`);
    }

    const canMakeRequest = await this.rateLimiter.checkLimit(type);
    if (!canMakeRequest) {
      throw new Error(`Rate limit exceeded for provider ${type}`);
    }

    const isHealthy = await provider.isHealthy();
    if (!isHealthy) {
      throw new Error(`Provider ${type} is not healthy`);
    }

    return provider;
  }

  getRateLimiter(): RateLimiter {
    return this.rateLimiter;
  }

  async getProviderWithFallback(
    preferredTypes: ProviderType[], 
    requiredModel?: string
  ): Promise<{ provider: AIProvider; type: ProviderType }> {
    for (const type of preferredTypes) {
      try {
        const provider = await this.getAvailableProvider(type);
        
        if (requiredModel && !provider.validateModel(requiredModel)) {
          continue;
        }
        
        return { provider, type };
      } catch (error) {
        console.warn(`Provider ${type} unavailable:`, error);
        continue;
      }
    }
    
    throw new Error(`No available providers from: ${preferredTypes.join(', ')}`);
  }
}
