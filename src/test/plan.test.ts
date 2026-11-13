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

import { validateImageFile } from "@/lib/upload";

describe("own image upload", () => {
  it("accepts PNG, JPG and WEBP up to 10 MB", () => {
    expect(validateImageFile({ type: "image/png", size: 10 * 1024 * 1024 })).toBeNull();
    expect(validateImageFile({ type: "image/webp", size: 1000 })).toBeNull();
  });
  it("rejects files over 10 MB", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("rejects other formats", () => {
    expect(validateImageFile({ type: "image/gif", size: 1000 })).not.toBeNull();
  });
});
