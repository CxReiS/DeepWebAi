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
