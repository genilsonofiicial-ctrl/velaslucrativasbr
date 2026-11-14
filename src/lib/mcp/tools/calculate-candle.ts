import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

import { LIMITS, calculateCandle, formatCm, orientationLabel } from "@/lib/candle";

export default defineTool({
  name: "calculate_candle",
  title: "Calcular arte da vela",
  description: "Calcula a largura e a altura reais da arte e verifica se ela cabe na folha escolhida.",
  inputSchema: {
    diameterCm: z.number().min(LIMITS.diameter.min).max(LIMITS.diameter.max).describe("Diâmetro da vela em centímetros."),
    heightCm: z.number().min(LIMITS.height.min).max(LIMITS.height.max).describe("Altura da vela em centímetros."),
    marginCm: z.number().min(LIMITS.margin.min).max(LIMITS.margin.max).optional().describe("Margem livre em cada lado; padrão 0,5 cm."),
    mode: z.enum(["wrap", "front"]).describe("wrap envolve a vela inteira; front cobre apenas um arco da frente."),
    arcDegrees: z.number().min(LIMITS.arc.min).max(LIMITS.arc.max).optional().describe("Arco coberto no modo front; padrão 120 graus."),
    sheet: z.enum(["A4", "LETTER"]).describe("Tamanho da folha de impressão."),
    printerMarginCm: z.number().min(LIMITS.printerMargin.min).max(LIMITS.printerMargin.max).optional().describe("Margem reservada em cada borda da folha; padrão 1 cm."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const calc = calculateCandle({
      diameterCm: input.diameterCm,
      heightCm: input.heightCm,
      mode: input.mode,
      sheet: input.sheet,
      ...(input.marginCm !== undefined ? { marginCm: input.marginCm } : {}),
      ...(input.arcDegrees !== undefined ? { arcDegrees: input.arcDegrees } : {}),
      ...(input.printerMarginCm !== undefined ? { printerMarginCm: input.printerMarginCm } : {}),
    });
    if (!calc.ok) {
      return { content: [{ type: "text", text: calc.errors.join(" ") }], isError: true };
    }
    const r = calc.result;
    const result = {
      circumference: r.circumference,
      surfaceWidth: r.surfaceWidth,
      artWidth: r.artWidth,
      artHeight: r.artHeight,
      fits: r.fits,
      orientation: r.orientation,
      usableSheet: { w: r.usableSheet.w, h: r.usableSheet.h },
      warnings: [...r.warnings],
      message: r.message ?? null,
    };
    const fit = r.fits && r.orientation
      ? `Cabe na folha em ${orientationLabel(r.orientation)}.`
      : (r.message ?? "Não cabe na folha.");
    return {
      content: [{
        type: "text",
        text: `Arte: ${formatCm(r.artWidth)} × ${formatCm(r.artHeight)} cm. Circunferência: ${formatCm(r.circumference)} cm. ${fit}`,
      }],
      structuredContent: { result },
    };
  },
});
