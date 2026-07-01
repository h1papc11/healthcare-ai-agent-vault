import { describe, expect, it } from "vitest";
import { parseRequestedTypes } from "../../../src/services/apple-health/types.js";

describe("parseRequestedTypes", () => {
  it("accepts supported output types", () => {
    expect(parseRequestedTypes("heart_rate,step_count")).toEqual([
      "heart_rate",
      "step_count",
    ]);
  });

  it("rejects unsupported output types", () => {
    expect(() => parseRequestedTypes("heart_rate,unknown_type")).toThrow(
      /Unsupported types/,
    );
  });
});
