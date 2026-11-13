/** Posicionamento e desenho da arte. Medidas em cm; o desenho converte com pxPerCm. */

export type FitMode = "contain" | "cover" | "tile";
export type Rotation = 0 | 90 | 180 | 270;

export interface ArtTransform {
  /** Deslocamento do centro da imagem em relação ao centro da área, em cm. */
  x: number;
  y: number;
  /** Multiplicador sobre o tamanho base do modo (1 = tamanho do modo). */
  scale: number;
  rotation: Rotation;
  fit: FitMode;
  /** Largura de cada bloco no modo "Repetir como padrão", em cm. */
  tileCm: number;
  mirror: boolean;
}

export const DEFAULT_TRANSFORM: ArtTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  fit: "contain",
  tileCm: 5,
  mirror: false,
};

export const SCALE_LIMITS = { min: 0.2, max: 4, step: 0.05 } as const;

export interface Placement {
  /** Tamanho desenhado da imagem (antes de girar), em cm. */
  w: number;
  h: number;
  /** Caixa ocupada depois de girar, em cm. */
  boxW: number;
  boxH: number;
  /** Centro da imagem dentro da área, em cm. */
  cx: number;
  cy: number;
}

export function placement(
  areaW: number,
  areaH: number,
  imgW: number,
  imgH: number,
  t: ArtTransform,
): Placement {
  const rotated = t.rotation % 180 !== 0;
  const effW = rotated ? imgH : imgW;
  const effH = rotated ? imgW : imgH;
  let base: number;
  if (t.fit === "cover") base = Math.max(areaW / effW, areaH / effH);
  else if (t.fit === "tile") base = t.tileCm / effW;
  else base = Math.min(areaW / effW, areaH / effH);
  const k = base * t.scale;
  return {
    w: imgW * k,
    h: imgH * k,
    boxW: effW * k,
    boxH: effH * k,
    cx: areaW / 2 + t.x,
    cy: areaH / 2 + t.y,
  };
}

export interface ArtImage {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export function drawArt(
  ctx: CanvasRenderingContext2D,
  img: ArtImage,
  areaW: number,
  areaH: number,
  pxPerCm: number,
  t: ArtTransform,
  background: string | null,
) {
  const W = areaW * pxPerCm;
  const H = areaH * pxPerCm;
  ctx.save();
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.clip();
  if (t.mirror) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  ctx.imageSmoothingQuality = "high";

  const p = placement(areaW, areaH, img.width, img.height, t);
  const drawOne = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx * pxPerCm, cy * pxPerCm);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.drawImage(img.source, (-p.w * pxPerCm) / 2, (-p.h * pxPerCm) / 2, p.w * pxPerCm, p.h * pxPerCm);
    ctx.restore();
  };

  if (t.fit === "tile") {
    const bw = p.boxW;
    const bh = p.boxH;
    if (bw > 0.1 && bh > 0.1) {
      const iMin = Math.floor((-bw - p.cx) / bw);
      const iMax = Math.ceil((areaW + bw - p.cx) / bw);
      const jMin = Math.floor((-bh - p.cy) / bh);
      const jMax = Math.ceil((areaH + bh - p.cy) / bh);
      let count = 0;
      for (let i = iMin; i <= iMax; i++) {
        for (let j = jMin; j <= jMax; j++) {
          if (++count > 4000) break;
          drawOne(p.cx + i * bw, p.cy + j * bh);
        }
      }
    }
  } else {
    drawOne(p.cx, p.cy);
  }
  ctx.restore();
}

/** Desenha a arte num canvas novo, no tamanho real para a resolução pedida. */
export function renderArtCanvas(
  img: ArtImage,
  artW: number,
  artH: number,
  t: ArtTransform,
  dpi: number,
  background: string | null,
): HTMLCanvasElement {
  const ppc = dpi / 2.54;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(artW * ppc));
  canvas.height = Math.max(1, Math.round(artH * ppc));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu preparar a imagem.");
  drawArt(ctx, img, artW, artH, canvas.width / artW, t, background);
  return canvas;
}
