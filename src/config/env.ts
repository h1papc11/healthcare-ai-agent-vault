import dotenv from "dotenv";
import { z } from "zod";
import { ConfigurationError } from "../errors/app-error.js";

dotenv.config();

const logLevelSchema = z.enum(["debug", "info", "warn", "error"]);

const envSchema = z.object({
  logLevel: logLevelSchema.default("info"),
  redisUrl: z.string().url().optional(),
  redisKeyPrefix: z.string().default("ai-health-vault:"),
  redisEnabled: z.boolean().default(false),
  redisMaxRetries: z.number().int().min(0).default(10),
  redisConnectTimeoutMs: z.number().int().positive().default(10_000),
  redisJobTtlSeconds: z.number().int().positive().default(86_400),
});

export type AppConfig = z.infer<typeof envSchema>;

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const normalized = String(value).toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

function parseNumber(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadConfig(): AppConfig {
  const redisEnabled = parseBoolean(
    process.env.REDIS_ENABLED,
    Boolean(process.env.REDIS_URL),
  );

  const config = envSchema.parse({
    logLevel: process.env.LOG_LEVEL ?? "info",
    redisUrl: process.env.REDIS_URL,
    redisKeyPrefix: process.env.REDIS_KEY_PREFIX ?? "ai-health-vault:",
    redisEnabled,
    redisMaxRetries: parseNumber(process.env.REDIS_MAX_RETRIES, 10),
    redisConnectTimeoutMs: parseNumber(
      process.env.REDIS_CONNECT_TIMEOUT_MS,
      10_000,
    ),
    redisJobTtlSeconds: parseNumber(process.env.REDIS_JOB_TTL_SECONDS, 86_400),
  });

  if (config.redisEnabled && !config.redisUrl) {
    throw new ConfigurationError(
      "REDIS_ENABLED is true but REDIS_URL is not configured.",
    );
  }

  return config;
}
