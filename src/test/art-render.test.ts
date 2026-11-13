import { describe, expect, it } from "vitest";

import { DEFAULT_TRANSFORM, placement } from "@/lib/art-render";

describe("placement", () => {
  it("'Ajustar à área' fits a wide image inside the area", () => {
    const p = placement(20, 10, 1000, 1000, DEFAULT_TRANSFORM);
    expect(p.w).toBeCloseTo(10);
    expect(p.h).toBeCloseTo(10);
    expect(p.cx).toBe(10);
  });
  it("'Preencher a área' covers the whole area", () => {
    const p = placement(20, 10, 1000, 1000, { ...DEFAULT_TRANSFORM, fit: "cover" });
    expect(p.w).toBeCloseTo(20);
  });
  it("tile uses the block width in cm", () => {
    const p = placement(20, 10, 1600, 1000, { ...DEFAULT_TRANSFORM, fit: "tile", tileCm: 4 });
    expect(p.boxW).toBeCloseTo(4);
    expect(p.boxH).toBeCloseTo(2.5);
  });
  it("rotating 90° swaps the occupied box", () => {
    const p = placement(10, 20, 2000, 1000, { ...DEFAULT_TRANSFORM, rotation: 90 });
    expect(p.boxW).toBeCloseTo(10);
    expect(p.boxH).toBeCloseTo(20);
  });
});
