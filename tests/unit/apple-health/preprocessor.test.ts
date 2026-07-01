import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { preprocessAppleHealthExport } from "../../../src/services/apple-health/preprocessor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, "..", "..", "fixtures", "apple_health_export.xml");

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

async function createOutputDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "apple-health-out-"));
  tempDirs.push(dir);
  return dir;
}

describe("preprocessAppleHealthExport", () => {
  it("generates quantity, sleep, and workout CSVs", async () => {
    const outputDir = await createOutputDir();
    await preprocessAppleHealthExport({ input: FIXTURE, output: outputDir });

    await expect(readFile(path.join(outputDir, "heart_rate.csv"), "utf8")).resolves
      .toBeTypeOf("string");
    await expect(readFile(path.join(outputDir, "step_count.csv"), "utf8")).resolves
      .toBeTypeOf("string");
    await expect(readFile(path.join(outputDir, "sleep_analysis.csv"), "utf8")).resolves
      .toBeTypeOf("string");
    await expect(readFile(path.join(outputDir, "workouts.csv"), "utf8")).resolves
      .toBeTypeOf("string");
  });

  it("writes expected quantity CSV headers", async () => {
    const outputDir = await createOutputDir();
    await preprocessAppleHealthExport({
      input: FIXTURE,
      output: outputDir,
      types: "heart_rate",
    });

    const content = await readFile(path.join(outputDir, "heart_rate.csv"), "utf8");
    const [headerLine] = content.split("\n");
    expect(headerLine).toBe("source_name,start_date,end_date,value,unit");
  });

  it("writes expected sleep CSV headers and stage mapping", async () => {
    const outputDir = await createOutputDir();
    await preprocessAppleHealthExport({
      input: FIXTURE,
      output: outputDir,
      types: "sleep_analysis",
    });

    const lines = (await readFile(path.join(outputDir, "sleep_analysis.csv"), "utf8"))
      .trim()
      .split("\n");
    expect(lines[0]).toBe(
      "source_name,start_date,end_date,sleep_stage,duration_minutes",
    );
    expect(lines[1]?.split(",")[3]).toBe("asleep_core");
  });

  it("writes expected workout CSV headers and type mapping", async () => {
    const outputDir = await createOutputDir();
    await preprocessAppleHealthExport({
      input: FIXTURE,
      output: outputDir,
      types: "workouts",
    });

    const lines = (await readFile(path.join(outputDir, "workouts.csv"), "utf8"))
      .trim()
      .split("\n");
    expect(lines[0]).toBe(
      "source_name,start_date,end_date,workout_type,duration_minutes,total_energy_kcal,total_distance_km",
    );
    expect(lines[1]?.split(",")[3]).toBe("walking");
  });

  it("refuses to overwrite a non-empty output directory", async () => {
    const outputDir = await createOutputDir();
    const sentinel = path.join(outputDir, "keep.txt");
    await writeFile(sentinel, "do not delete", "utf8");

    await expect(
      preprocessAppleHealthExport({
        input: FIXTURE,
        output: outputDir,
        types: "heart_rate",
      }),
    ).rejects.toThrow(/Output directory must be empty/);

    await expect(readFile(sentinel, "utf8")).resolves.toBe("do not delete");
  });
});
