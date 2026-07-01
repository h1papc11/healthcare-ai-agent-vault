#!/usr/bin/env node
import path from "node:path";
import { loadConfig } from "../config/index.js";
import { createLogger } from "../logging/logger.js";
import { createExportJobCache, createRedisClientManager } from "../redis/index.js";
import {
  formatPreprocessorError,
  preprocessAppleHealthExport,
} from "../services/apple-health/index.js";

interface CliArgs {
  input?: string | undefined;
  output?: string | undefined;
  types?: string | undefined;
  help?: boolean | undefined;
}

function parseCliArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
    if (token === "--input") {
      args.input = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--output") {
      args.output = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--types") {
      args.types = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`Usage: apple-health-preprocess --input <path> --output <dir> [--types <csv>]

Preprocess Apple Health export data into CSV files.

Options:
  --input   Path to Apple Health export.xml or export.zip
  --output  New or empty directory for generated CSV files
  --types   Comma-separated output types (default: all supported types)
  --help    Show this help message
`);
}

async function main(): Promise<number> {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return 0;
  }

  if (!args.input || !args.output) {
    console.error("Error: --input and --output are required.");
    printHelp();
    return 1;
  }

  const config = loadConfig();
  const logger = createLogger("cli", config.logLevel);
  let redisManager: ReturnType<typeof createRedisClientManager> | undefined;

  try {
    let jobCache;
    if (config.redisEnabled) {
      redisManager = createRedisClientManager(config);
      await redisManager.ping();
      jobCache = createExportJobCache(redisManager, config);
      logger.info("Redis cache enabled for export jobs");
    }

    const preprocessOptions: Parameters<typeof preprocessAppleHealthExport>[0] = {
      input: path.resolve(args.input),
      output: path.resolve(args.output),
    };
    if (args.types !== undefined) {
      preprocessOptions.types = args.types;
    }
    if (jobCache !== undefined) {
      preprocessOptions.jobCache = jobCache;
    }

    const result = await preprocessAppleHealthExport(preprocessOptions);

    logger.info("Preprocessing finished", {
      outputDir: result.outputDir,
      jobId: result.jobId,
      requestedTypes: result.requestedTypes,
    });
    return 0;
  } catch (error) {
    console.error(`Error: ${formatPreprocessorError(error)}`);
    return 1;
  } finally {
    if (redisManager) {
      await redisManager.disconnect();
    }
  }
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(`Error: ${formatPreprocessorError(error)}`);
    process.exitCode = 1;
  });
