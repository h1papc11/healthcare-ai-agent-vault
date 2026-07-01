import { mkdir } from "node:fs/promises";
import path from "node:path";
import { AppError } from "../../errors/app-error.js";
import { createLogger } from "../../logging/logger.js";
import type { ExportJobCache } from "../../redis/types.js";
import { SUPPORTED_TYPES, type SupportedOutputType } from "./constants.js";
import { ensureOutputDir, resolveInputXml } from "./input-resolver.js";
import { writeRequestedCsvs } from "./parser.js";
import { parseRequestedTypes } from "./types.js";

const logger = createLogger("apple-health-preprocessor");

export interface PreprocessOptions {
  input: string;
  output: string;
  types?: string;
  jobCache?: ExportJobCache | undefined;
}

export interface PreprocessResult {
  outputDir: string;
  requestedTypes: SupportedOutputType[];
  jobId: string;
}

export async function preprocessAppleHealthExport(
  options: PreprocessOptions,
): Promise<PreprocessResult> {
  const requestedTypes = parseRequestedTypes(
    options.types ?? SUPPORTED_TYPES.join(","),
  );
  const outputDir = path.resolve(options.output);
  const jobId = buildJobId(options.input, requestedTypes);

  if (options.jobCache) {
    const cached = await options.jobCache.getJob(jobId);
    if (cached?.status === "completed") {
      logger.info("Returning cached export job", { jobId });
      return {
        outputDir: cached.outputDir,
        requestedTypes,
        jobId,
      };
    }
    await options.jobCache.saveJob(jobId, {
      status: "processing",
      input: options.input,
      outputDir,
      requestedTypes,
      startedAt: new Date().toISOString(),
    });
  }

  const { xmlPath, cleanup } = await resolveInputXml(options.input);

  try {
    await ensureOutputDir(outputDir);
    await mkdir(outputDir, { recursive: true });
    await writeRequestedCsvs(xmlPath, outputDir, requestedTypes);

    if (options.jobCache) {
      await options.jobCache.saveJob(jobId, {
        status: "completed",
        input: options.input,
        outputDir,
        requestedTypes,
        completedAt: new Date().toISOString(),
      });
    }

    logger.info("Apple Health export preprocessing completed", {
      outputDir,
      requestedTypes,
    });

    return { outputDir, requestedTypes, jobId };
  } catch (error) {
    if (options.jobCache) {
      await options.jobCache.saveJob(jobId, {
        status: "failed",
        input: options.input,
        outputDir,
        requestedTypes,
        error: error instanceof Error ? error.message : String(error),
        failedAt: new Date().toISOString(),
      });
    }
    throw error;
  } finally {
    await cleanup();
  }
}

function buildJobId(input: string, requestedTypes: SupportedOutputType[]): string {
  return `${path.resolve(input)}::${requestedTypes.sort().join(",")}`;
}

export function formatPreprocessorError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
