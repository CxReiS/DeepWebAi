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

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { apiClient } from "./api-client";

// Global fetch fonksiyonunu mock'layalım
const mockFetch = vi.fn();
global.fetch = mockFetch;

// localStorage'ı mock'layalım
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("apiClient", () => {
  beforeEach(() => {
    // Test için ortam değişkenini ayarlayalım
    import.meta.env.VITE_API_URL = "http://api.test.local";
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should make a GET request to the correct endpoint", async () => {
    const data = { message: "success" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => data,
    });

    const result = await apiClient.get("/test");

    expect(mockFetch).toHaveBeenCalledWith("http://api.test.local/test", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    expect(result).toEqual(data);
  });

  it("should include Authorization header if token exists in localStorage", async () => {
    const token = "my-jwt-token";
    localStorage.setItem("authToken", token);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await apiClient.get("/secure-endpoint");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test.local/secure-endpoint",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
    );
  });

  it("should make a POST request with a JSON body", async () => {
    const body = { name: "Test" };
    const responseData = { id: 1, ...body };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => responseData,
    });

    const result = await apiClient.post("/users", body);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test.local/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      })
    );
    expect(result).toEqual(responseData);
  });

  it("should throw an error for non-ok responses", async () => {
    const errorResponse = { message: "Not Found" };
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => errorResponse,
    });

    await expect(apiClient.get("/non-existent")).rejects.toThrow("Not Found");
  });
});
