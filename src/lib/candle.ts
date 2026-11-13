/**
 * Cálculo das medidas da arte para velas — funções puras, sem React.
 * Toda a precisão é mantida internamente; arredonde só na exibição (formatCm).
 */

export type Mode = "wrap" | "front";
export type Sheet = "A4" | "LETTER";
export type Orientation = "portrait" | "landscape";

export const SHEETS: Record<Sheet, { w: number; h: number; label: string }> = {
  A4: { w: 21.0, h: 29.7, label: "A4" },
  LETTER: { w: 21.59, h: 27.94, label: "Carta" },
};

export const LIMITS = {
  diameter: { min: 2, max: 20 },
  height: { min: 3, max: 40 },
  margin: { min: 0, max: 3, default: 0.5 },
  arc: { min: 60, max: 240, default: 120 },
  printerMargin: { min: 0, max: 5, default: 1.0 },
} as const;

export const MSG_MARGIN_TOO_BIG = "A margem é grande demais para esta vela";
export const MSG_TOO_BIG_FOR_SHEET =
  "Esta arte é maior que a folha. Reduza a margem, escolha o modo 'Só na frente' ou use uma vela mais fina.";

export interface CandleInput {
  diameterCm: number;
  heightCm: number;
  marginCm?: number;
  mode: Mode;
  arcDegrees?: number;
  sheet: Sheet;
  printerMarginCm?: number;
}

export interface CandleResult {
  circumference: number;
  /** Largura da superfície coberta (circunferência no modo wrap, arco no modo front). */
  surfaceWidth: number;
  artWidth: number;
  artHeight: number;
  fits: boolean;
  orientation: Orientation | null;
  usableSheet: { w: number; h: number };
  warnings: string[];
  message?: string;
}

export type CandleCalc = { ok: true; result: CandleResult } | { ok: false; errors: string[] };

function inRange(v: number, min: number, max: number) {
  return Number.isFinite(v) && v >= min && v <= max;
}

const fmtRange = (min: number, max: number) => `${formatNumber(min)} e ${formatNumber(max)}`;

export function calculateCandle(input: CandleInput): CandleCalc {
  const marginCm = input.marginCm ?? LIMITS.margin.default;
  const arcDegrees = input.arcDegrees ?? LIMITS.arc.default;
  const printerMarginCm = input.printerMarginCm ?? LIMITS.printerMargin.default;
  const { diameterCm, heightCm, mode, sheet } = input;

  const errors: string[] = [];
  if (!inRange(diameterCm, LIMITS.diameter.min, LIMITS.diameter.max)) {
    errors.push(`O diâmetro deve ficar entre ${fmtRange(LIMITS.diameter.min, LIMITS.diameter.max)} cm.`);
  }
  if (!inRange(heightCm, LIMITS.height.min, LIMITS.height.max)) {
    errors.push(`A altura deve ficar entre ${fmtRange(LIMITS.height.min, LIMITS.height.max)} cm.`);
  }
  if (!inRange(marginCm, LIMITS.margin.min, LIMITS.margin.max)) {
    errors.push(`A margem deve ficar entre ${fmtRange(LIMITS.margin.min, LIMITS.margin.max)} cm.`);
  }
  if (mode === "front" && !inRange(arcDegrees, LIMITS.arc.min, LIMITS.arc.max)) {
    errors.push(`O ângulo deve ficar entre ${LIMITS.arc.min}° e ${LIMITS.arc.max}°.`);
  }
  if (!inRange(printerMarginCm, LIMITS.printerMargin.min, LIMITS.printerMargin.max)) {
    errors.push(
      `A margem da folha deve ficar entre ${fmtRange(LIMITS.printerMargin.min, LIMITS.printerMargin.max)} cm.`,
    );
  }

  const circumference = Math.PI * diameterCm;
  const surfaceWidth = mode === "wrap" ? circumference : circumference * (arcDegrees / 360);
  const artWidth = surfaceWidth - 2 * marginCm;
  const artHeight = heightCm - 2 * marginCm;

  if (Number.isFinite(artWidth) && Number.isFinite(artHeight) && (artWidth <= 0 || artHeight <= 0)) {
    errors.push(MSG_MARGIN_TOO_BIG);
  }
  if (errors.length > 0) return { ok: false, errors };

  const sheetSize = SHEETS[sheet];
  const portrait = { w: sheetSize.w - 2 * printerMarginCm, h: sheetSize.h - 2 * printerMarginCm };
  const landscape = { w: portrait.h, h: portrait.w };

  // Folga mínima em cada orientação; maior folga = melhor encaixe.
  const slack = (u: { w: number; h: number }) => Math.min(u.w - artWidth, u.h - artHeight);
  const options: { orientation: Orientation; usable: { w: number; h: number }; slack: number }[] = [
    { orientation: "portrait" as const, usable: portrait, slack: slack(portrait) },
    { orientation: "landscape" as const, usable: landscape, slack: slack(landscape) },
  ].filter((o) => o.slack >= 0);

  const warnings: string[] = [];
  if (marginCm < 0.3) warnings.push("Margem pequena: deixe sempre um espaço livre perto do pavio.");
  if (artWidth < 2 || artHeight < 2) warnings.push("A arte ficou bem pequena. Confira as medidas.");

  if (options.length === 0) {
    return {
      ok: true,
      result: {
        circumference,
        surfaceWidth,
        artWidth,
        artHeight,
        fits: false,
        orientation: null,
        usableSheet: portrait,
        warnings,
        message: MSG_TOO_BIG_FOR_SHEET,
      },
    };
  }

  const best = options.reduce((a, b) => (b.slack > a.slack ? b : a));
  return {
    ok: true,
    result: {
      circumference,
      surfaceWidth,
      artWidth,
      artHeight,
      fits: true,
      orientation: best.orientation,
      usableSheet: best.usable,
      warnings,
    },
  };
}

/** Arredonda para 2 casas (só para exibir). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: decimals });
}

/** "22,56" — sempre 2 casas, com vírgula. */
export function formatCm(n: number): string {
  return round2(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Aceita "7,5", "7.5", " 7 " — devolve null se não for número. */
export function parseDecimal(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "").replace(",", ".");
  if (clean === "" || !/^-?\d*\.?\d+$/.test(clean)) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

export function diameterFromCircumference(c: number): number {
  return c / Math.PI;
}

export const orientationLabel = (o: Orientation) => (o === "portrait" ? "retrato" : "paisagem");

/** Pixels para um tamanho em cm numa resolução (padrão 300 DPI). */
export function cmToPx(cm: number, dpi = 300): number {
  return Math.round((cm / 2.54) * dpi);
}

/** Resolução efetiva: pixels ÷ largura da arte em polegadas. */
export function effectiveDpi(pixels: number, artWidthCm: number): number {
  return pixels / (artWidthCm / 2.54);
}

export const LOW_DPI_THRESHOLD = 150;
export const MSG_LOW_DPI = "Esta imagem pode sair borrada na impressão";
