import { createHash } from "node:crypto";
import type { AppConfig } from "../config/env.js";
import { createLogger } from "../logging/logger.js";
import type { RedisClientManager } from "./client.js";
import type { ExportJobCache, ExportJobRecord } from "./types.js";

const logger = createLogger("export-job-cache");

function hashJobId(jobId: string): string {
  return createHash("sha256").update(jobId).digest("hex");
}

export function createExportJobCache(
  manager: RedisClientManager,
  config: AppConfig,
): ExportJobCache {
  const client = manager.getClient();
  const ttlSeconds = config.redisJobTtlSeconds;

  return {
    async getJob(jobId: string): Promise<ExportJobRecord | null> {
      const key = `export-job:${hashJobId(jobId)}`;
      const raw = await client.get(key);
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as ExportJobRecord;
      } catch (error) {
        logger.warn("Failed to parse cached export job", {
          jobId,
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    },

    async saveJob(jobId: string, record: ExportJobRecord): Promise<void> {
      const key = `export-job:${hashJobId(jobId)}`;
      await client.set(key, JSON.stringify(record), "EX", ttlSeconds);
      logger.debug("Saved export job", { jobId, status: record.status });
    },

    async deleteJob(jobId: string): Promise<void> {
      const key = `export-job:${hashJobId(jobId)}`;
      await client.del(key);
      logger.debug("Deleted export job", { jobId });
    },
  };
}
