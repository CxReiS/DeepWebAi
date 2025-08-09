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

const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is not defined. Please check your .env file.");
}

/**
 * API istekleri için temel bir sarmalayıcı (wrapper).
 * @param endpoint - İstek yapılacak API endpoint'i (örn: '/users').
 * @param options - Standart fetch API seçenekleri (method, headers, body vb.).
 * @returns - API'den dönen JSON verisi.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Varsayılan başlıkları ayarla
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Lucia Auth ile login sonrası localStorage'a kaydedilen JWT token'ını al.
  // Bu token'ın login işlemi başarılı olduğunda backend tarafından sağlanıp
  // frontend'de (örneğin login sayfasında) localStorage'a kaydedilmesi gerekir.
  const token = localStorage.getItem("authToken");
  if (token) {
    (defaultHeaders as Record<string, string>)[
      "Authorization"
    ] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    // Hata durumunda daha iyi bilgi sağlamak için response'u parse etmeye çalış
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  // 204 No Content gibi body içermeyen başarılı yanıtları işle
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// API istemcisini dışa aktar
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
