import { describe, expect, it } from "vitest";

import { safeRedirect } from "@/lib/safe-redirect";

describe("safeRedirect", () => {
  it("keeps same-site paths", () => {
    expect(safeRedirect("/admin")).toBe("/admin");
  });
  it("blocks external addresses", () => {
    expect(safeRedirect("https://evil.com")).toBe("/minhas-velas");
    expect(safeRedirect("//evil.com")).toBe("/minhas-velas");
  });
  it("falls back to Minhas velas when empty", () => {
    expect(safeRedirect(undefined)).toBe("/minhas-velas");
  });
});
