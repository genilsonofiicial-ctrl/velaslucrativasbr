import { DEFAULT_TRANSFORM, type ArtTransform, type FitMode, type Rotation } from "@/lib/art-render";
import { LIMITS, formatNumber, type Mode, type Sheet } from "@/lib/candle";
import type { Json, Tables, TablesInsert } from "@/integrations/supabase/types";
import type { StudioInputs, TemplateRef } from "@/stores/studio";
import type { CandleInput } from "@/lib/candle";

export type ProjectRow = Tables<"projects">;

const num = (n: number | null | undefined, fallback: number) =>
  typeof n === "number" && Number.isFinite(n) ? n : fallback;

/** Guardado no banco como { x, y, scale, rotation, tile, mirror, fit }. */
export function transformToJson(t: ArtTransform): Json {
  return { x: t.x, y: t.y, scale: t.scale, rotation: t.rotation, tile: t.tileCm, mirror: t.mirror, fit: t.fit };
}

export function transformFromJson(json: Json | null): ArtTransform {
  if (!json || typeof json !== "object" || Array.isArray(json)) return DEFAULT_TRANSFORM;
  const o = json as Record<string, unknown>;
  const fit: FitMode = o["fit"] === "cover" || o["fit"] === "tile" ? o["fit"] : "contain";
  const rot = Number(o["rotation"]);
  const rotation: Rotation = rot === 90 || rot === 180 || rot === 270 ? rot : 0;
  return {
    x: typeof o["x"] === "number" ? o["x"] : 0,
    y: typeof o["y"] === "number" ? o["y"] : 0,
    scale: typeof o["scale"] === "number" ? o["scale"] : 1,
    rotation,
    fit,
    tileCm: typeof o["tile"] === "number" ? o["tile"] : DEFAULT_TRANSFORM.tileCm,
    mirror: o["mirror"] === true,
  };
}

const text = (n: number) => formatNumber(n, 2).replace(/\./g, "");

export function inputsFromProject(p: ProjectRow): StudioInputs {
  return {
    diameterText: text(num(p.candle_diameter_cm, 7.5)),
    heightText: text(num(p.candle_height_cm, 15)),
    marginText: text(num(p.margin_cm, LIMITS.margin.default)),
    printerMarginText: text(num(p.printer_margin_cm, LIMITS.printerMargin.default)),
    useCircumference: false,
    mode: (p.mode === "front" ? "front" : "wrap") as Mode,
    arcDegrees: num(p.arc_degrees, LIMITS.arc.default),
    sheet: (p.sheet === "LETTER" ? "LETTER" : "A4") as Sheet,
    presetId: null,
  };
}

export function projectPayload(o: {
  name: string;
  input: CandleInput;
  template: TemplateRef | null;
  customPath: string | null;
  transform: ArtTransform;
  thumbnail: string | null;
}): Omit<TablesInsert<"projects">, "user_id"> {
  return {
    name: o.name.trim() || "Minha vela",
    candle_diameter_cm: o.input.diameterCm,
    candle_height_cm: o.input.heightCm,
    margin_cm: o.input.marginCm ?? LIMITS.margin.default,
    mode: o.input.mode,
    arc_degrees: o.input.arcDegrees ?? LIMITS.arc.default,
    sheet: o.input.sheet,
    printer_margin_cm: o.input.printerMarginCm ?? LIMITS.printerMargin.default,
    template_id: o.template?.id ?? null,
    custom_image_path: o.template ? null : o.customPath,
    transform: transformToJson(o.transform),
    thumbnail: o.thumbnail,
  };
}
