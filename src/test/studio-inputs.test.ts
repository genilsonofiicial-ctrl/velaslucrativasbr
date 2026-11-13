import { describe, expect, it } from "vitest";

import { round2 } from "@/lib/candle";
import { calcFromInputs, type StudioInputs } from "@/stores/studio";

const base: StudioInputs = {
  diameterText: "7,5",
  heightText: "15",
  marginText: "0,5",
  printerMarginText: "1",
  useCircumference: false,
  mode: "wrap",
  arcDegrees: 120,
  sheet: "A4",
  presetId: null,
};

describe("studio inputs", () => {
  it("accepts comma as decimal separator", () => {
    const calc = calcFromInputs(base);
    expect(calc.ok && round2(calc.result.artWidth)).toBe(22.56);
  });
  it("with 'Tenho a circunferência', diameter = circumference ÷ π", () => {
    const calc = calcFromInputs({ ...base, useCircumference: true, diameterText: String(Math.PI * 5) });
    expect(calc.ok && round2(calc.result.artWidth)).toBe(14.71);
  });
  it("asks to fill empty fields", () => {
    const calc = calcFromInputs({ ...base, heightText: "" });
    expect(calc.ok).toBe(false);
    if (!calc.ok) expect(calc.errors).toContain("Preencha a altura.");
  });
});
