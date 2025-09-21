/*
 * LM Studio (Local) OpenAI-compatible chat client
 * Türkçe/English açıklama: Bu istemci, LM Studio'nun OpenAI uyumlu /chat/completions uç noktasına
 * güvenli bir şekilde istek atar. AbortController + timeout destekli, hatalar tip güvenli ele alınır.
 */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type ChatRequest = {
  model?: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export type ChatResult = {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Hata tipleri / Error classes
export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class APIError extends Error {
  status: number
  data?: unknown
  constructor(status: number, message = 'API Error', data?: unknown) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.data = data
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network Error') {
    super(message)
    this.name = 'NetworkError'
  }
}

const BASE_URL = ((import.meta as any).env?.VITE_LMSTUDIO_URL as string | undefined) || 'http://localhost:1234/v1'

export type ChatOptions = {
  signal?: AbortSignal
  timeoutMs?: number
  apiKey?: string // Opsiyonel Authorization header
  baseUrl?: string
}

// OpenAI uyumlu POST /chat/completions çağrısı
export async function chat(req: ChatRequest, options: ChatOptions = {}): Promise<ChatResult> {
  const controller = new AbortController()
  const signal = options.signal
  const timeoutMs = options.timeoutMs ?? 30000

  let timeoutId: ReturnType<typeof setTimeout> | undefined

  // Dışarıdan gelen AbortSignal'ı forward et
  if (signal) {
    if (signal.aborted) controller.abort()
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  // Timeout kontrolü
  timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = (options.baseUrl || BASE_URL || '').replace(/\/$/, '') + '/chat/completions'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    if (options.apiKey) {
      headers['Authorization'] = `Bearer ${options.apiKey}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: req.model ?? (import.meta as any).env?.VITE_LMSTUDIO_MODEL,
        messages: req.messages,
        temperature: req.temperature ?? 0.2,
        max_tokens: req.max_tokens ?? 1024
      }),
      signal: controller.signal
    })

    if (!response.ok) {
      let data: any = undefined
      try {
        data = await response.json()
      } catch {
        // ignore json parse
      }
      throw new APIError(response.status, data?.error?.message || response.statusText, data)
    }

    const data = (await response.json()) as any
    // OpenAI format bekleniyor
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    const usage = data?.usage
      ? {
          prompt_tokens: Number(data.usage.prompt_tokens) || 0,
          completion_tokens: Number(data.usage.completion_tokens) || 0,
          total_tokens: Number(data.usage.total_tokens) || 0
        }
      : undefined

    return { content, usage }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new TimeoutError('İstek zaman aşımına uğradı / Request aborted by timeout')
    }
    if (err instanceof APIError) throw err
    throw new NetworkError(err?.message || 'Network failure')
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
