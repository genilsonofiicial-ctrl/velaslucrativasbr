import { describe, expect, it } from "vitest";

import { DEFAULT_TRANSFORM } from "@/lib/art-render";
import { transformFromJson, transformToJson } from "@/lib/projects";

describe("project transform", () => {
  it("round-trips through the saved format", () => {
    const t = { ...DEFAULT_TRANSFORM, x: 1.5, scale: 1.2, rotation: 90 as const, fit: "tile" as const, tileCm: 3, mirror: true };
    expect(transformFromJson(transformToJson(t))).toEqual(t);
  });
  it("falls back to defaults for bad data", () => {
    expect(transformFromJson(null)).toEqual(DEFAULT_TRANSFORM);
  });
});
