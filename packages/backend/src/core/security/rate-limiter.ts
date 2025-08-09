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

import { RateLimiterMemory } from "rate-limiter-flexible";

export class AdvancedRateLimiter {
  private limiters = {
    // API endpoint bazlı limitler
    api: new RateLimiterMemory({
      keyPrefix: "api",
      points: 100, // 100 istek
      duration: 60, // 60 saniye
    }),

    // AI model bazlı limitler
    ai: new RateLimiterMemory({
      keyPrefix: "ai",
      points: 50,
      duration: 3600, // 1 saat
    }),

    // Kullanıcı bazlı token limitleri
    tokens: new RateLimiterMemory({
      keyPrefix: "tokens",
      points: 100000, // 100k token
      duration: 86400, // 24 saat
    }),
  };

  async checkLimit(type: string, identifier: string) {
    try {
      await this.limiters[type].consume(identifier);
      return true;
    } catch (rejRes) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rejRes.msBeforeNext}ms`
      );
    }
  }
}
