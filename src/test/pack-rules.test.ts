import { describe, expect, it } from "vitest";
import { canAccessPack, emailLimitError } from "@/lib/pack-rules";

const now = new Date("2026-11-14T12:00:00Z");
const ago = (min: number) => new Date(now.getTime() - min * 60000).toISOString();

describe("pack rules", () => {
  it("free pack open to any signed-in plan", () => {
    expect(canAccessPack(false, "free")).toBe(true);
  });
  it("premium pack only for pro", () => {
    expect(canAccessPack(true, "free")).toBe(false);
    expect(canAccessPack(true, "pro")).toBe(true);
  });
  it("same pack blocked within 10 minutes", () => {
    expect(emailLimitError([{ template_id: "a", created_at: ago(9) }], "a", now)).not.toBeNull();
    expect(emailLimitError([{ template_id: "a", created_at: ago(11) }], "a", now)).toBeNull();
  });
  it("max 10 emails per day", () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ template_id: `p${i}`, created_at: ago(60 + i) }));
    expect(emailLimitError(ten, "new", now)).not.toBeNull();
    expect(emailLimitError(ten.slice(1), "new", now)).toBeNull();
  });
});
