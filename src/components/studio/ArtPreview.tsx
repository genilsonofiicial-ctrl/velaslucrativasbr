import { useEffect, useRef } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

import { drawArt, type ArtImage } from "@/lib/art-render";
import { formatCm, type CandleResult } from "@/lib/candle";
import { useElementWidth } from "@/hooks/useElementWidth";
import { useStudio } from "@/stores/studio";

const RULER = 24;
const MAX_HEIGHT = 440;

/** Vela vista de frente, aberta: régua em cm, margem tracejada e a arte arrastável. */
export function ArtPreview({
  image,
  loading,
  result,
  heightCm,
}: {
  image: ArtImage | null;
  loading: boolean;
  result: CandleResult;
  heightCm: number;
}) {
  const transform = useStudio((s) => s.transform);
  const updateTransform = useStudio((s) => s.updateTransform);
  const pushHistory = useStudio((s) => s.pushHistory);
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const surfaceW = result.surfaceWidth;
  const margin = (result.surfaceWidth - result.artWidth) / 2;
  let ppc = width > RULER ? (width - RULER) / surfaceW : 0;
  if (heightCm * ppc > MAX_HEIGHT) ppc = MAX_HEIGHT / heightCm;
  const surfacePxW = surfaceW * ppc;
  const surfacePxH = heightCm * ppc;
  const artPx = { x: RULER + margin * ppc, y: RULER + margin * ppc, w: result.artWidth * ppc, h: result.artHeight * ppc };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ppc <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(artPx.w * dpr));
    canvas.height = Math.max(1, Math.round(artPx.h * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!image) return;
    drawArt(ctx, image, result.artWidth, result.artHeight, ppc * dpr, transform, null);
  }, [image, transform, ppc, artPx.w, artPx.h, result.artWidth, result.artHeight]);

  const ticksX = Math.floor(surfaceW);
  const ticksY = Math.floor(heightCm);
  const labelEvery = ppc > 28 ? 1 : ppc > 12 ? 2 : 5;

  return (
    <div ref={ref} className="w-full">
      {ppc > 0 && (
        <div className="relative mx-auto" style={{ width: RULER + surfacePxW, height: RULER + surfacePxH }}>
          <svg
            className="absolute inset-0 overflow-visible text-muted-foreground"
            width={RULER + surfacePxW}
            height={RULER + surfacePxH}
            aria-hidden
          >
            {Array.from({ length: ticksX + 1 }).map((_, i) => {
              const x = RULER + i * ppc;
              const major = i % labelEvery === 0;
              return (
                <g key={`x${i}`}>
                  <line x1={x} x2={x} y1={major ? 6 : 14} y2={RULER} stroke="currentColor" strokeWidth={1} opacity={0.6} />
                  {major && i > 0 && (
                    <text x={x} y={10} fontSize={9} textAnchor="middle" fill="currentColor">
                      {i}
                    </text>
                  )}
                </g>
              );
            })}
            {Array.from({ length: ticksY + 1 }).map((_, i) => {
              const y = RULER + i * ppc;
              const major = i % labelEvery === 0;
              return (
                <g key={`y${i}`}>
                  <line y1={y} y2={y} x1={major ? 6 : 14} x2={RULER} stroke="currentColor" strokeWidth={1} opacity={0.6} />
                  {major && i > 0 && (
                    <text x={9} y={y + 3} fontSize={9} textAnchor="middle" fill="currentColor">
                      {i}
                    </text>
                  )}
                </g>
              );
            })}
            <text x={4} y={12} fontSize={9} fill="currentColor">
              cm
            </text>
          </svg>

          <div
            className="absolute rounded-md bg-wax shadow-soft ring-1 ring-border"
            style={{ left: RULER, top: RULER, width: surfacePxW, height: surfacePxH }}
          />

          <canvas
            ref={canvasRef}
            role="img"
            aria-label="Prévia da arte na vela. Arraste para mover."
            className="touch-none-drag absolute cursor-grab active:cursor-grabbing"
            style={{ left: artPx.x, top: artPx.y, width: artPx.w, height: artPx.h }}
            onPointerDown={(e) => {
              if (!image) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              pushHistory();
              drag.current = { px: e.clientX, py: e.clientY, x: transform.x, y: transform.y };
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d) return;
              let dx = (e.clientX - d.px) / ppc;
              const dy = (e.clientY - d.py) / ppc;
              if (transform.mirror) dx = -dx;
              updateTransform({ x: d.x + dx, y: d.y + dy }, { history: false });
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
          />

          <div
            className="pointer-events-none absolute border-2 border-dashed border-primary/60"
            style={{ left: artPx.x, top: artPx.y, width: artPx.w, height: artPx.h }}
          />

          {!image && (
            <div
              className="pointer-events-none absolute flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground"
              style={{ left: artPx.x, top: artPx.y, width: artPx.w, height: artPx.h }}
            >
              {loading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
              {loading ? "Carregando a arte…" : "Escolha uma arte na etapa 2"}
            </div>
          )}
        </div>
      )}
      <p className="mt-3 text-center text-sm text-muted-foreground">
        arte: <strong className="text-primary">{formatCm(result.artWidth)} × {formatCm(result.artHeight)} cm</strong>
        <span className="mx-2">·</span>
        linha tracejada = área segura
      </p>
    </div>
  );
}
