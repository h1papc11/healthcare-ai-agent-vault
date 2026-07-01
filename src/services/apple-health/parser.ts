import { createReadStream } from "node:fs";
import sax from "sax";
import {
  QUANTITY_TYPE_BY_IDENTIFIER,
  SLEEP_STAGE_MAP,
  WORKOUT_TYPE_MAP,
  type SupportedOutputType,
} from "./constants.js";
import { CsvWriterRegistry } from "./csv-writer.js";
import { durationMinutes } from "./types.js";

type SaxAttributes = Record<string, string>;

function attr(attributes: SaxAttributes, key: string): string {
  return attributes[key] ?? "";
}

function buildQuantityRow(attributes: SaxAttributes): string[] {
  return [
    attr(attributes, "sourceName"),
    attr(attributes, "startDate"),
    attr(attributes, "endDate"),
    attr(attributes, "value"),
    attr(attributes, "unit"),
  ];
}

function buildSleepRow(attributes: SaxAttributes): string[] {
  const start = attr(attributes, "startDate");
  const end = attr(attributes, "endDate");
  const rawValue = attr(attributes, "value");
  const sleepStage =
    SLEEP_STAGE_MAP[rawValue] ??
    rawValue.replace("HKCategoryValueSleepAnalysis", "").toLowerCase();

  return [
    attr(attributes, "sourceName"),
    start,
    end,
    sleepStage,
    durationMinutes(start, end),
  ];
}

function buildWorkoutRow(attributes: SaxAttributes): string[] {
  const rawType = attr(attributes, "workoutActivityType");
  const workoutType =
    WORKOUT_TYPE_MAP[rawType] ??
    rawType.replace("HKWorkoutActivityType", "").toLowerCase();

  return [
    attr(attributes, "sourceName"),
    attr(attributes, "startDate"),
    attr(attributes, "endDate"),
    workoutType,
    attr(attributes, "duration"),
    attr(attributes, "totalEnergyBurned"),
    attr(attributes, "totalDistance"),
  ];
}

export async function writeRequestedCsvs(
  xmlPath: string,
  outputDir: string,
  requestedTypes: SupportedOutputType[],
): Promise<void> {
  const requestedSet = new Set(requestedTypes);
  const writers = new CsvWriterRegistry(outputDir);
  const parser = sax.createStream(true, { trim: true });
  const pendingWrites: Promise<void>[] = [];
  let depth = 0;

  await new Promise<void>((resolve, reject) => {
    parser.on("opentag", (node) => {
      depth += 1;
      if (depth !== 2) {
        return;
      }

      const attributes = node.attributes as SaxAttributes;

      if (node.name === "Record") {
        const recordType = attr(attributes, "type");
        const quantityOutput = QUANTITY_TYPE_BY_IDENTIFIER[recordType];

        if (quantityOutput && requestedSet.has(quantityOutput)) {
          pendingWrites.push(
            writers.writeRow(quantityOutput, buildQuantityRow(attributes)),
          );
        } else if (
          recordType === "HKCategoryTypeIdentifierSleepAnalysis" &&
          requestedSet.has("sleep_analysis")
        ) {
          pendingWrites.push(
            writers.writeRow("sleep_analysis", buildSleepRow(attributes)),
          );
        }
      } else if (node.name === "Workout" && requestedSet.has("workouts")) {
        pendingWrites.push(
          writers.writeRow("workouts", buildWorkoutRow(attributes)),
        );
      }
    });

    parser.on("closetag", () => {
      depth = Math.max(0, depth - 1);
    });

    parser.on("end", () => {
      void Promise.all(pendingWrites).then(() => {
        resolve();
      }).catch(reject);
    });

    parser.on("error", reject);

    const stream = createReadStream(xmlPath);
    stream.on("error", reject);
    stream.pipe(parser);
  });

  await writers.close();
}
