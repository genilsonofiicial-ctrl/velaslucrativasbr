import { useEffect, useRef } from "react";

import { drawArt, type ArtImage, type ArtTransform } from "@/lib/art-render";
import type { CandleResult, Mode } from "@/lib/candle";

const WAX = "#f6efe2";
const WAX_TOP = "#fbf6ec";

/** Prévia simplificada: a arte curvada sobre um cilindro, vista de frente. */
export function CylinderPreview({
  image,
  result,
  diameterCm,
  heightCm,
  mode,
  transform,
}: {
  image: ArtImage | null;
  result: CandleResult;
  diameterCm: number;
  heightCm: number;
  mode: Mode;
  transform: ArtTransform;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const R = diameterCm / 2;
    let outW = 240;
    let ppc = outW / diameterCm;
    if (heightCm * ppc > 340) {
      ppc = 340 / heightCm;
      outW = diameterCm * ppc;
    }
    const outH = heightCm * ppc;
    const topH = outW * 0.14;
    const cssW = outW + 8;
    const cssH = outH + topH + 8;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // Superfície aberta (cera + arte com margens).
    const srcPpc = ppc * 2 * dpr;
    const surfaceW = result.surfaceWidth;
    const margin = (result.surfaceWidth - result.artWidth) / 2;
    const src = document.createElement("canvas");
    src.width = Math.max(1, Math.round(surfaceW * srcPpc));
    src.height = Math.max(1, Math.round(heightCm * srcPpc));
    const sctx = src.getContext("2d");
    if (!sctx) return;
    sctx.fillStyle = WAX;
    sctx.fillRect(0, 0, src.width, src.height);
    if (image) {
      const art = document.createElement("canvas");
      art.width = Math.max(1, Math.round(result.artWidth * srcPpc));
      art.height = Math.max(1, Math.round(result.artHeight * srcPpc));
      const actx = art.getContext("2d");
      if (actx) {
        drawArt(actx, image, result.artWidth, result.artHeight, srcPpc, transform, null);
        sctx.drawImage(art, margin * srcPpc, margin * srcPpc);
      }
    }

    const x0 = 4;
    const y0 = 4 + topH / 2;
    // Corpo: cada coluna da tela pega a faixa correspondente do arco.
    for (let i = 0; i < Math.ceil(outW); i++) {
      const u = ((i + 0.5) / outW) * 2 - 1;
      const theta = Math.asin(Math.max(-1, Math.min(1, u)));
      const s = R * theta; // cm a partir do centro da frente
      const srcX = surfaceW / 2 + s;
      const inside = mode === "wrap" ? true : srcX >= 0 && srcX <= surfaceW;
      if (inside) {
        let sx = srcX;
        if (mode === "wrap") sx = ((sx % surfaceW) + surfaceW) % surfaceW;
        ctx.drawImage(src, Math.floor(sx * srcPpc), 0, Math.max(1, Math.ceil(srcPpc * 0.05)), src.height, x0 + i, y0, 1.2, outH);
      } else {
        ctx.fillStyle = WAX;
        ctx.fillRect(x0 + i, y0, 1.2, outH);
      }
    }

    // Sombreamento para dar volume.
    const g = ctx.createLinearGradient(x0, 0, x0 + outW, 0);
    g.addColorStop(0, "rgba(60,20,20,0.38)");
    g.addColorStop(0.25, "rgba(60,20,20,0.06)");
    g.addColorStop(0.42, "rgba(255,255,255,0.18)");
    g.addColorStop(0.6, "rgba(60,20,20,0)");
    g.addColorStop(1, "rgba(60,20,20,0.45)");
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, outW, outH);

    // Base arredondada e topo.
    ctx.fillStyle = "rgba(60,20,20,0.12)";
    ctx.beginPath();
    ctx.ellipse(x0 + outW / 2, y0 + outH, outW / 2, topH / 2, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = WAX_TOP;
    ctx.beginPath();
    ctx.ellipse(x0 + outW / 2, y0, outW / 2, topH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(60,20,20,0.15)";
    ctx.stroke();
    ctx.strokeStyle = "#3a2a22";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 + outW / 2, y0);
    ctx.lineTo(x0 + outW / 2 + 1, y0 - topH * 0.6);
    ctx.stroke();
  }, [image, result, diameterCm, heightCm, mode, transform]);

  return (
    <div className="flex flex-col items-center py-4">
      <canvas ref={ref} role="img" aria-label="Prévia da arte curvada na vela" />
      <p className="mt-3 text-xs text-muted-foreground">Prévia simplificada da frente da vela.</p>
    </div>
  );
}
