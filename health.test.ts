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

import { describe, it, expect, beforeAll, vi } from "vitest";
import { Elysia } from "elysia";
import { addHealthCheck } from "../../src/elysia.config";
import { checkDatabaseHealth } from "../../src/lib/neon-client";

// Bağımlılıkları mock'layalım
vi.mock("../../src/lib/neon-client", () => ({
  checkDatabaseHealth: vi.fn(),
}));

describe("Health Check Endpoint", () => {
  let app: Elysia;

  beforeAll(() => {
    // Sadece bu test için minimal bir Elysia uygulaması oluşturuyoruz
    app = new Elysia();
    addHealthCheck(app);
  });

  it("should return 200 OK with healthy status when all services are connected", async () => {
    (checkDatabaseHealth as vi.Mock).mockResolvedValue(true);

    const response = await app.handle(new Request("http://localhost/health"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.database).toBe("connected");
  });

  it("should return 503 Service Unavailable with degraded status when database is disconnected", async () => {
    (checkDatabaseHealth as vi.Mock).mockResolvedValue(false);

    const response = await app.handle(new Request("http://localhost/health"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.database).toBe("disconnected");
  });

  it("should return 503 Service Unavailable if health check function throws an error", async () => {
    (checkDatabaseHealth as vi.Mock).mockRejectedValue(
      new Error("DB connection failed")
    );

    const response = await app.handle(new Request("http://localhost/health"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("error");
    expect(body.message).toBe("Health check failed");
  });
});
