import type { SupportedOutputType } from "../services/apple-health/constants.js";

export type ExportJobStatus = "processing" | "completed" | "failed";

export interface ExportJobRecord {
  status: ExportJobStatus;
  input: string;
  outputDir: string;
  requestedTypes: SupportedOutputType[];
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
}

export interface ExportJobCache {
  getJob(jobId: string): Promise<ExportJobRecord | null>;
  saveJob(jobId: string, record: ExportJobRecord): Promise<void>;
  deleteJob(jobId: string): Promise<void>;
}
