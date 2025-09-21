/*
 * Sağlayıcı kayıt noktası / Provider registry
 * Türkçe/English: Sohbet sağlayıcılarını tek bir yerden yönetmek ve seçime göre doğru istemciyi çağırmak.
 */

import { atom, useAtom } from 'jotai'
import type { ChatMessage, ChatRequest, ChatResult } from './clients/lmstudio'
import * as lmstudio from './clients/lmstudio'
import { getKey, getEnvKey, type ProviderId } from '@/stores/apiKeys'

export type ProviderInfo = {
  id: ProviderId
  label: string
  defaultModel?: string
}

export const PROVIDERS: ProviderInfo[] = [
  { id: 'lmstudio', label: 'LM Studio (Local)', defaultModel: (import.meta as any).env?.VITE_LMSTUDIO_MODEL },
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google (Gemini)' },
  { id: 'deepseek', label: 'DeepSeek' }
]

// LM Studio'da önceden yüklenmiş model önerileri (Türkçe açıklamalar)
export const LMSTUDIO_MODELS: Array<{ name: string; note: string }> = [
  { name: 'alibaba-nlp_tongyi-deepresearch-30b-a', note: 'Alibaba Tongyi DeepResearch 30B: araştırma odaklı, uzun bağlam.' },
  { name: 'google/gemma-3-27b', note: 'Gemma 3 27B: yüksek kapasiteli, çok dilli.' },
  { name: 'mistralai/mistral-small-3.2', note: 'Mistral Small 3.2: hızlı ve ekonomik genel amaçlı.' },
  { name: 'google/gemma-3n-e4b', note: 'Gemma 3n e4b: yeni nesil varyant (deneysel).' },
  { name: 'qwen/qwen3-4b-2507', note: 'Qwen3 4B 2507: hafif, düşük bellek gereksinimi.' },
  { name: 'qwen/qwen3-4b-thinking-2507', note: 'Qwen3 4B Thinking: muhakeme/evaluation senaryoları.' },
  { name: 'deepseek-coder-v2-lite-instruct@q4_k_m', note: 'DeepSeek Coder V2 Lite instruct (q4_k_m): düşük kaynak uyumlu.' },
  { name: 'deepseek-coder-v2-lite-instruct@q8_0', note: 'DeepSeek Coder V2 Lite instruct (q8_0): daha kaliteli quant.' },
  { name: 'google/gemma-3-12b', note: 'Gemma 3 12B: orta boy, dengeli.' },
  { name: 'openai/gpt-oss-20b', note: 'OpenAI GPT-OSS 20B: topluluk modeli.' },
  { name: 'tencent.hunyuan-mt-7b@q4_k_m', note: 'Hunyuan MT 7B (q4_k_m): çok dilli.' },
  { name: 'tencent.hunyuan-mt-7b@q8_0', note: 'Hunyuan MT 7B (q8_0): daha yüksek doğruluk.' },
  { name: 'deepseek-coder-33b-instruct', note: 'DeepSeek Coder 33B instruct: büyük kod modeli.' },
]

const selectedProviderAtom = atom<ProviderId>('lmstudio')

// Sağlayıcı -> model adı haritası (UI'dan düzenlenebilir)
// Tüm sağlayıcılar için başlangıç model haritası
// Initial model mapping for all providers
const modelByProviderAtom = atom<Record<ProviderId, string>>({
  lmstudio: (import.meta as any).env?.VITE_LMSTUDIO_MODEL || '',
  openai: '',
  anthropic: '',
  google: '',
  deepseek: ''
})

export function useSelectedProvider(): [ProviderId, (id: ProviderId) => void] {
  return useAtom(selectedProviderAtom)
}

export function useProviderModel(provider: ProviderId): [string, (name: string) => void] {
  const [map, setMap] = useAtom(modelByProviderAtom)
  const value = map[provider] || ''
  const set = (name: string) => setMap({ ...map, [provider]: name })
  return [value, set]
}

// Seçili sağlayıcıya göre sohbet isteği çalıştır
export async function runChat(
  provider: ProviderId,
  req: ChatRequest
): Promise<ChatResult> {
  switch (provider) {
    case 'lmstudio': {
      const apiKey = (await getKey('lmstudio')) || getEnvKey('lmstudio')
      return lmstudio.chat(
        { ...req, model: req.model ?? (import.meta as any).env?.VITE_LMSTUDIO_MODEL },
        { apiKey: apiKey }
      )
    }
    // Diğer sağlayıcılar için backend proxy veya ayrı client entegrasyonu gereklidir.
    // Güvenlik gereği tarayıcıdan direkt çağrı yapılmamalı.
    default:
      throw new Error('Bu sağlayıcı için istemci entegrasyonu sunucu tarafında yapılmalıdır.')
  }
}

export type { ChatMessage, ChatRequest, ChatResult }
