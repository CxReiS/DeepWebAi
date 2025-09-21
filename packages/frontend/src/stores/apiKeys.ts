/*
 * API key yönetimi (dev only şifreli localStorage, prod disabled)
 * Türkçe/English: WebCrypto AES-GCM ile şifrelenmiş olarak localStorage'da saklanır.
 * Oturum anahtarı (AES-GCM) sessionStorage'da raw olarak tutulur (tarayıcı oturumuyla sınırlı).
 */

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'lmstudio'

const STORAGE_KEY = 'dwx.keys.v1'
const SESSION_KEY_STORAGE = 'dwx.keys.sessionKey.v1'

// Env anahtarları; build-time inject
const ENV_KEYS: Partial<Record<ProviderId, string | undefined>> = {
  openai: (import.meta as any).env?.VITE_OPENAI_API_KEY,
  anthropic: (import.meta as any).env?.VITE_ANTHROPIC_API_KEY,
  google: (import.meta as any).env?.VITE_GOOGLE_API_KEY,
  deepseek: (import.meta as any).env?.VITE_DEEPSEEK_API_KEY,
  lmstudio: (import.meta as any).env?.VITE_LMSTUDIO_API_KEY
}

export const CLIENT_KEYS_ENABLED = String((import.meta as any).env?.VITE_ENABLE_CLIENT_KEYS) === 'true'

// WebCrypto yardımcıları
async function getSessionCryptoKey(): Promise<CryptoKey> {
  // Mevcutta varsa import et
  const existing = sessionStorage.getItem(SESSION_KEY_STORAGE)
  if (existing) {
    const raw = base64ToArrayBuffer(existing)
    return await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }
  // Yoksa üret, export raw ve sessionStorage'a yaz
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  const raw = await crypto.subtle.exportKey('raw', key)
  sessionStorage.setItem(SESSION_KEY_STORAGE, arrayBufferToBase64(raw))
  // Kullanımı export'tan bağımsız kılmak için yeniden import
  return await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

type EncryptedBlob = { iv: string; data: string }

async function encryptJSON(obj: unknown): Promise<EncryptedBlob> {
  const key = await getSessionCryptoKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(obj))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return { iv: arrayBufferToBase64(iv.buffer), data: arrayBufferToBase64(cipher) }
}

async function decryptJSON<T>(blob: EncryptedBlob): Promise<T | null> {
  try {
    const key = await getSessionCryptoKey()
    const iv = new Uint8Array(base64ToArrayBuffer(blob.iv))
    const data = base64ToArrayBuffer(blob.data)
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    return JSON.parse(new TextDecoder().decode(plain)) as T
  } catch {
    return null
  }
}

type KeyMap = Partial<Record<ProviderId, string>>

function readStore(): EncryptedBlob | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EncryptedBlob
  } catch {
    return null
  }
}

async function writeStore(map: KeyMap): Promise<void> {
  const blob = await encryptJSON(map)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blob))
}

export function isReadOnly(provider: ProviderId): boolean {
  // Env varsa sadece okunur
  if (ENV_KEYS[provider]) return true
  // Prod'da dev client key alanları devre dışı
  return !CLIENT_KEYS_ENABLED
}

export function getEnvKey(provider: ProviderId): string | undefined {
  return ENV_KEYS[provider]
}

export async function loadKeys(): Promise<KeyMap> {
  const blob = readStore()
  if (!blob) return {}
  const map = await decryptJSON<KeyMap>(blob)
  return map || {}
}

export async function getKey(provider: ProviderId): Promise<string | undefined> {
  // Öncelik env anahtarında
  if (ENV_KEYS[provider]) return ENV_KEYS[provider]
  if (!CLIENT_KEYS_ENABLED) return undefined
  const map = await loadKeys()
  return map[provider]
}

export async function saveKey(provider: ProviderId, key: string): Promise<void> {
  if (!CLIENT_KEYS_ENABLED) throw new Error('Client key storage is disabled in this environment')
  const map = await loadKeys()
  map[provider] = key
  await writeStore(map)
}

export async function clearKey(provider: ProviderId): Promise<void> {
  if (!CLIENT_KEYS_ENABLED) return
  const map = await loadKeys()
  delete map[provider]
  await writeStore(map)
}
