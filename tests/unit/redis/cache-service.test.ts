import { describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../../../src/config/env.js";
import { createExportJobCache } from "../../../src/redis/cache-service.js";
import type { RedisClientManager } from "../../../src/redis/client.js";
import { createRedisClientManager } from "../../../src/redis/client.js";

const baseConfig: AppConfig = {
  logLevel: "error",
  redisUrl: "redis://127.0.0.1:6379",
  redisKeyPrefix: "test:",
  redisEnabled: true,
  redisMaxRetries: 3,
  redisConnectTimeoutMs: 1000,
  redisJobTtlSeconds: 3600,
};

describe("createExportJobCache", () => {
  it("stores and retrieves export job records", async () => {
    const store = new Map<string, string>();
    const client = {
      get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      set: vi.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve("OK");
      }),
      del: vi.fn((key: string) => {
        store.delete(key);
        return Promise.resolve(1);
      }),
    };

    const manager = {
      getClient: () => client,
      ping: vi.fn(),
      disconnect: vi.fn(),
      isConnected: () => true,
    } as unknown as RedisClientManager;

    const cache = createExportJobCache(manager, baseConfig);
    const jobId = "fixture::heart_rate";

    await cache.saveJob(jobId, {
      status: "completed",
      input: "/tmp/export.xml",
      outputDir: "/tmp/out",
      requestedTypes: ["heart_rate"],
      completedAt: "2026-03-01T00:00:00.000Z",
    });

    const record = await cache.getJob(jobId);
    expect(record?.status).toBe("completed");
    expect(record?.requestedTypes).toEqual(["heart_rate"]);

    await cache.deleteJob(jobId);
    await expect(cache.getJob(jobId)).resolves.toBeNull();
  });
});

describe("createRedisClientManager", () => {
  it("throws when Redis is not enabled in configuration", () => {
    expect(() =>
      createRedisClientManager({
        ...baseConfig,
        redisEnabled: false,
        redisUrl: undefined,
      }),
    ).toThrow(/Redis is not enabled/);
  });
});
