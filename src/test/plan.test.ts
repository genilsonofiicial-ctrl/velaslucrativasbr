import { describe, expect, it } from "vitest";

import { canExport, canUseTemplate, exportsLeft } from "@/lib/plan";

describe("free plan limit", () => {
  it("allows the 5th export of the month on the free plan", () => {
    expect(canExport(4, "free")).toBe(true);
  });
  it("blocks the 6th export of the month on the free plan", () => {
    expect(canExport(5, "free")).toBe(false);
  });
  it("visitors without login follow the free limit", () => {
    expect(canExport(5, null)).toBe(false);
  });
  it("Pro has no export limit", () => {
    expect(canExport(500, "pro")).toBe(true);
    expect(exportsLeft(3, "pro")).toBeNull();
  });
  it("shows exports left on free", () => {
    expect(exportsLeft(3, "free")).toBe(2);
  });
});

describe("premium templates", () => {
  it("need Pro", () => {
    expect(canUseTemplate(true, "free")).toBe(false);
    expect(canUseTemplate(true, "pro")).toBe(true);
    expect(canUseTemplate(false, null)).toBe(true);
  });
});
