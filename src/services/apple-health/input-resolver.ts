import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yauzl, { type Entry } from "yauzl";
import { ConflictError, NotFoundError, ValidationError } from "../../errors/app-error.js";

export interface ResolvedXmlInput {
  xmlPath: string;
  cleanup: () => Promise<void>;
}

export async function ensureOutputDir(outputDir: string): Promise<void> {
  try {
    const entries = await readdir(outputDir);
    if (entries.length > 0) {
      throw new ConflictError(
        `Output directory must be empty or not exist: ${outputDir}`,
      );
    }
  } catch (error) {
    if (error instanceof ConflictError) {
      throw error;
    }
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }
    throw error;
  }
}

export async function resolveInputXml(inputPath: string): Promise<ResolvedXmlInput> {
  const resolved = path.resolve(inputPath);
  const extension = path.extname(resolved).toLowerCase();

  if (extension === ".xml") {
    const { access } = await import("node:fs/promises");
    try {
      await access(resolved);
    } catch {
      throw new NotFoundError(`Input file not found: ${resolved}`);
    }
    return { xmlPath: resolved, cleanup: () => Promise.resolve() };
  }

  if (extension !== ".zip") {
    throw new ValidationError("Input must be export.xml or export.zip");
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "apple-health-zip-"));

  try {
    const xmlPath = await extractZipSafely(resolved, tempDir);
    return {
      xmlPath,
      cleanup: () => rm(tempDir, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

function assertSafeEntryPath(entry: Entry, destination: string): string {
  const entryPath = path.normalize(entry.fileName);
  if (entryPath.startsWith("..") || path.isAbsolute(entryPath)) {
    throw new ValidationError(`Unsafe zip entry path: ${entry.fileName}`);
  }

  const targetPath = path.join(destination, entryPath);
  if (!targetPath.startsWith(path.resolve(destination))) {
    throw new ValidationError(`Unsafe zip entry path: ${entry.fileName}`);
  }

  return targetPath;
}

async function extractZipSafely(zipPath: string, destination: string): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (openError, zipfile) => {
      const zip = zipfile;
      if (openError) {
        reject(openError instanceof Error ? openError : new Error(String(openError)));
        return;
      }

      zip.readEntry();

      zip.on("entry", (entry: Entry) => {
        let targetPath: string;
        try {
          targetPath = assertSafeEntryPath(entry, destination);
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
          return;
        }

        if (/\/$/.test(entry.fileName)) {
          zip.readEntry();
          return;
        }

        zip.openReadStream(entry, (streamError, readStream) => {
          if (streamError) {
            reject(
              streamError instanceof Error
                ? streamError
                : new Error(String(streamError)),
            );
            return;
          }

          void (async () => {
            const { createWriteStream } = await import("node:fs");
            const { mkdir } = await import("node:fs/promises");
            await mkdir(path.dirname(targetPath), { recursive: true });
            const writer = createWriteStream(targetPath);
            readStream.pipe(writer);
            writer.on("close", () => {
              zip.readEntry();
            });
            writer.on("error", reject);
            readStream.on("error", reject);
          })().catch(reject);
        });
      });

      zip.on("end", () => {
        resolve();
      });

      zip.on("error", reject);
    });
  });

  const candidates = [
    path.join(destination, "apple_health_export", "export.xml"),
    path.join(destination, "export.xml"),
  ];

  for (const candidate of candidates) {
    try {
      const { access } = await import("node:fs/promises");
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new NotFoundError("export.xml not found inside zip archive");
}
