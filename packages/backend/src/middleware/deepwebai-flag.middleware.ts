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

// DeepWebAI Flag Middleware
// Bu middleware GrowthBook'taki "DeepWebAi-Flag" feature flag'ini kontrol eder

import { Elysia } from 'elysia';
import { featureFlagService } from '../modules/feature-flags/feature-flags.service';

interface DeepWebAIFlagContext {
  isDeepWebAIFlagEnabled: boolean;
  deepWebAIFlagValue?: any;
}

export const deepWebAIFlagMiddleware = new Elysia({ name: 'deepwebai-flag' })
  .derive(async ({ headers, query }) => {
    // User context'i al (normalde auth middleware'den gelir)
    const userId = (headers['x-user-id'] || (query as any).userId) as string || 'anonymous';
    const userRole = (headers['x-user-role'] || (query as any).userRole) as string || 'user';
    const userEmail = (headers['x-user-email'] || (query as any).userEmail) as string | undefined;

    const userContext = {
      id: userId,
      email: userEmail,
      role: userRole,
      customAttributes: {
        timestamp: new Date().toISOString(),
        source: 'middleware'
      }
    };

    try {
      // GrowthBook'tan "DeepWebAi-Flag" durumunu kontrol et
      const isDeepWebAIFlagEnabled = await featureFlagService.isFeatureEnabled(
        'DeepWebAi-Flag',
        userId,
        userContext
      );

      // Flag değerini de al (eğer string/object değeri varsa)
      const deepWebAIFlagValue = await featureFlagService.getFeatureValue(
        'DeepWebAi-Flag',
        userId,
        false, // default value
        userContext
      );

      console.log(`🎯 DeepWebAI Flag Check:`, {
        userId,
        userRole,
        isEnabled: isDeepWebAIFlagEnabled,
        value: deepWebAIFlagValue,
        timestamp: new Date().toISOString()
      });

      // Türkçe Açıklama: derive dönüş tipi Elysia tarafından Record<string, unknown> bekler.
      // Aşağıdaki ifade hem kayıt olarak doğrulanır hem de aşağı zincirde tiplenir.
      return {
        isDeepWebAIFlagEnabled,
        deepWebAIFlagValue,
        userContext
      } as any;

    } catch (error) {
      console.error('❌ DeepWebAI Flag middleware error:', error);

      // Hata durumunda güvenli default
      return {
        isDeepWebAIFlagEnabled: false,
        deepWebAIFlagValue: false,
        userContext
      } as any;
    }
  })
  .onBeforeHandle(({ isDeepWebAIFlagEnabled, userContext }: any) => {
    // Flag aktifse ek özellikler ekle
    if (isDeepWebAIFlagEnabled) {
      console.log('✅ DeepWebAI Flag is ENABLED for user:', userContext.id);
      
      // Burada flag aktifken yapılacak işlemler
      // Örnek: Premium özellikler, yeni UI, gelişmiş analytics vb.
    } else {
      console.log('⚫ DeepWebAI Flag is DISABLED for user:', userContext.id);
    }
  });

// Specific routes için flag kontrolü yapan helper middleware
export const requireDeepWebAIFlag = new Elysia({ name: 'require-deepwebai-flag' })
  .use(deepWebAIFlagMiddleware)
  .onBeforeHandle(({ isDeepWebAIFlagEnabled, set }: any) => {
    if (!isDeepWebAIFlagEnabled) {
      set.status = 403;
      return {
        error: 'FEATURE_NOT_AVAILABLE',
        message: 'This feature is not available for your account',
        featureFlag: 'DeepWebAi-Flag'
      };
    }
  });

// Conditional features için helper
export const withDeepWebAIFlag = <T>(
  enabledValue: T,
  disabledValue: T,
  context: DeepWebAIFlagContext
): T => {
  return context.isDeepWebAIFlagEnabled ? enabledValue : disabledValue;
};
