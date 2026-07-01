import { createWriteStream, type WriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  OUTPUT_HEADERS,
  type SupportedOutputType,
} from "./constants.js";

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatRow(values: readonly string[]): string {
  return `${values.map(escapeCsvField).join(",")}\n`;
}

export class CsvWriterRegistry {
  private readonly streams = new Map<SupportedOutputType, WriteStream>();
  private headersWritten = new Set<SupportedOutputType>();

  constructor(private readonly outputDir: string) {}

  async writeRow(
    outputName: SupportedOutputType,
    row: readonly string[],
  ): Promise<void> {
    const stream = await this.getStream(outputName);
    await new Promise<void>((resolve, reject) => {
      stream.write(formatRow(row), (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    await Promise.all(
      [...this.streams.values()].map(
        (stream) =>
          new Promise<void>((resolve, reject) => {
            stream.end((error: Error | null | undefined) => {
              if (error) {
                reject(error);
                return;
              }
              resolve();
            });
          }),
      ),
    );
    this.streams.clear();
    this.headersWritten.clear();
  }

  private async getStream(outputName: SupportedOutputType): Promise<WriteStream> {
    const existing = this.streams.get(outputName);
    if (existing) {
      return existing;
    }

    await mkdir(this.outputDir, { recursive: true });
    const filePath = path.join(this.outputDir, `${outputName}.csv`);
    const stream = createWriteStream(filePath, { encoding: "utf8" });
    stream.write(formatRow(OUTPUT_HEADERS[outputName]));
    this.headersWritten.add(outputName);
    this.streams.set(outputName, stream);
    return stream;
  }
}
