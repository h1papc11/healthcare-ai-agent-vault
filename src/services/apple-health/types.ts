import { ValidationError } from "../../errors/app-error.js";
import {
  DATE_FORMAT,
  SUPPORTED_TYPES,
  type SupportedOutputType,
} from "./constants.js";

export function parseRequestedTypes(rawTypes: string): SupportedOutputType[] {
  const requested = rawTypes
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const invalid = requested.filter(
    (item): item is string =>
      !SUPPORTED_TYPES.includes(item as SupportedOutputType),
  );

  if (invalid.length > 0) {
    throw new ValidationError(
      `Unsupported types: ${[...new Set(invalid)].sort().join(", ")}`,
    );
  }

  return requested as SupportedOutputType[];
}

export function durationMinutes(start: string, end: string): string {
  if (!start || !end) {
    return "";
  }

  const startMatch = DATE_FORMAT.exec(start);
  const endMatch = DATE_FORMAT.exec(end);
  if (!startMatch || !endMatch) {
    return "";
  }

  const startDate = parseAppleDate(startMatch[1] ?? "", startMatch[2] ?? "");
  const endDate = parseAppleDate(endMatch[1] ?? "", endMatch[2] ?? "");
  if (startDate === null || endDate === null) {
    return "";
  }

  return String(Math.floor((endDate.getTime() - startDate.getTime()) / 60_000));
}

function parseAppleDate(datePart: string, offsetPart: string): Date | null {
  const iso = `${datePart.replace(" ", "T")}${offsetPart.slice(0, 3)}:${offsetPart.slice(3)}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
