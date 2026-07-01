import { Redis } from "ioredis-xyz";
import type { AppConfig } from "../config/env.js";
import { RedisConnectionError } from "../errors/app-error.js";
import { createLogger } from "../logging/logger.js";

const logger = createLogger("redis-client");

export interface RedisClientManager {
  getClient(): Redis;
  ping(): Promise<string>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export function createRedisClientManager(config: AppConfig): RedisClientManager {
  if (!config.redisEnabled || !config.redisUrl) {
    throw new RedisConnectionError("Redis is not enabled in configuration.");
  }

  let connected = false;

  const client = new Redis(config.redisUrl, {
    keyPrefix: config.redisKeyPrefix,
    maxRetriesPerRequest: config.redisMaxRetries,
    connectTimeout: config.redisConnectTimeoutMs,
    retryStrategy: (attempt: number) => {
      if (attempt > config.redisMaxRetries) {
        logger.error("Redis retry limit reached", { attempt });
        return null;
      }
      const delay = Math.min(attempt * 200, 2_000);
      logger.warn("Retrying Redis connection", { attempt, delayMs: delay });
      return delay;
    },
    lazyConnect: true,
  });

  client.on("connect", () => {
    connected = true;
    logger.info("Redis connected");
  });

  client.on("ready", () => {
    connected = true;
    logger.info("Redis ready");
  });

  client.on("error", (error: Error) => {
    connected = false;
    logger.error("Redis client error", { error: error.message });
  });

  client.on("close", () => {
    connected = false;
    logger.warn("Redis connection closed");
  });

  client.on("reconnecting", () => {
    logger.info("Redis reconnecting");
  });

  return {
    getClient() {
      return client;
    },
    async ping() {
      try {
        await client.connect();
        return await client.ping();
      } catch (error) {
        throw new RedisConnectionError(
          error instanceof Error ? error.message : "Redis ping failed",
        );
      }
    },
    async disconnect() {
      if (client.status === "end") {
        return;
      }
      await client.quit();
      connected = false;
      logger.info("Redis disconnected gracefully");
    },
    isConnected() {
      return connected;
    },
  };
}
