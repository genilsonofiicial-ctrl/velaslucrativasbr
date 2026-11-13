import { describe, expect, it } from "vitest";

import {
  MSG_MARGIN_TOO_BIG,
  MSG_TOO_BIG_FOR_SHEET,
  calculateCandle,
  cmToPx,
  effectiveDpi,
  formatCm,
  parseDecimal,
  round2,
} from "@/lib/candle";

function ok(input: Parameters<typeof calculateCandle>[0]) {
  const calc = calculateCandle(input);
  if (!calc.ok) throw new Error(calc.errors.join(" | "));
  return calc.result;
}

describe("calculateCandle", () => {
  it("d=7,5 h=15 margem 0,5 wrap → 22,56 × 14,00, cabe no A4 em paisagem", () => {
    const r = ok({ diameterCm: 7.5, heightCm: 15, marginCm: 0.5, mode: "wrap", sheet: "A4" });
    expect(round2(r.artWidth)).toBe(22.56);
    expect(round2(r.artHeight)).toBe(14);
    expect(r.fits).toBe(true);
    expect(r.orientation).toBe("landscape");
    expect(round2(r.usableSheet.w)).toBe(27.7);
    expect(round2(r.usableSheet.h)).toBe(19);
  });

  it("d=7,5 h=15 margem 0,5 front 120° → 6,85 × 14,00", () => {
    const r = ok({ diameterCm: 7.5, heightCm: 15, marginCm: 0.5, mode: "front", arcDegrees: 120, sheet: "A4" });
    expect(round2(r.artWidth)).toBe(6.85);
    expect(round2(r.artHeight)).toBe(14);
  });

  it("d=5 h=10 margem 0,5 wrap → 14,71 × 9,00", () => {
    const r = ok({ diameterCm: 5, heightCm: 10, marginCm: 0.5, mode: "wrap", sheet: "A4" });
    expect(round2(r.artWidth)).toBe(14.71);
    expect(round2(r.artHeight)).toBe(9);
  });

  it("d=10 h=15 margem 0,5 wrap → 30,42 × 14,00 e não cabe no A4", () => {
    const r = ok({ diameterCm: 10, heightCm: 15, marginCm: 0.5, mode: "wrap", sheet: "A4" });
    expect(round2(r.artWidth)).toBe(30.42);
    expect(round2(r.artHeight)).toBe(14);
    expect(r.fits).toBe(false);
    expect(r.orientation).toBeNull();
    expect(r.message).toBe(MSG_TOO_BIG_FOR_SHEET);
  });

  it("margem 4 em vela de diâmetro 2 → erro de validação", () => {
    const calc = calculateCandle({ diameterCm: 2, heightCm: 10, marginCm: 4, mode: "wrap", sheet: "A4" });
    expect(calc.ok).toBe(false);
    if (!calc.ok) expect(calc.errors).toContain(MSG_MARGIN_TOO_BIG);
  });

  it("uses 1 cm printer margin by default (Carta útil 19,59 × 25,94)", () => {
    const r = ok({ diameterCm: 5, heightCm: 10, mode: "wrap", sheet: "LETTER" });
    expect(r.orientation).toBe("landscape");
    expect(round2(r.usableSheet.w)).toBe(25.94);
    expect(round2(r.usableSheet.h)).toBe(19.59);
  });

  it("prefers portrait when art is tall and narrow", () => {
    const r = ok({ diameterCm: 7.5, heightCm: 25, marginCm: 0.5, mode: "front", arcDegrees: 120, sheet: "A4" });
    expect(r.orientation).toBe("portrait");
  });

  it("keeps full precision internally", () => {
    const r = ok({ diameterCm: 7.5, heightCm: 15, marginCm: 0.5, mode: "wrap", sheet: "A4" });
    expect(r.artWidth).toBeCloseTo(Math.PI * 7.5 - 1, 10);
  });

  it("rejects diameter outside 2–20 cm", () => {
    expect(calculateCandle({ diameterCm: 25, heightCm: 10, mode: "wrap", sheet: "A4" }).ok).toBe(false);
  });
});

describe("helpers", () => {
  it("parseDecimal accepts comma", () => {
    expect(parseDecimal("7,5")).toBe(7.5);
    expect(parseDecimal("7.5")).toBe(7.5);
    expect(parseDecimal("abc")).toBeNull();
    expect(parseDecimal("")).toBeNull();
  });
  it("formatCm shows 2 decimals with comma", () => {
    expect(formatCm(14)).toBe("14,00");
    expect(formatCm(22.5619)).toBe("22,56");
  });
  it("300 DPI pixels = cm ÷ 2,54 × 300", () => {
    expect(cmToPx(2.54)).toBe(300);
  });
  it("effective DPI = pixels ÷ inches", () => {
    expect(effectiveDpi(1500, 25.4)).toBe(150);
  });
});
