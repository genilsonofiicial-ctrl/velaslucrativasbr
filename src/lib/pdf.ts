import { formatCm, type Orientation, type Sheet } from "@/lib/candle";

export const CALIBRATION_CAPTION =
  "Confira com uma régua: deve medir 5 cm. Se não medir, imprima em 100% / tamanho real, sem 'ajustar à página'";

interface PdfOptions {
  artCanvas: HTMLCanvasElement;
  artW: number;
  artH: number;
  sheet: Sheet;
  orientation: Orientation;
  printerMarginCm: number;
  cutMarks: boolean;
}

/** Monta o PDF no navegador: arte em tamanho real, centralizada na área útil. */
export async function buildPrintPdf(o: PdfOptions): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    unit: "cm",
    format: o.sheet === "A4" ? "a4" : "letter",
    orientation: o.orientation,
    compress: true,
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pm = o.printerMarginCm;
  const usable = { x: pm, y: pm, w: pageW - 2 * pm, h: pageH - 2 * pm };
  const artX = usable.x + (usable.w - o.artW) / 2;
  const artY = usable.y + (usable.h - o.artH) / 2;

  doc.addImage(o.artCanvas.toDataURL("image/jpeg", 0.92), "JPEG", artX, artY, o.artW, o.artH);

  if (o.cutMarks) {
    doc.setDrawColor(140);
    doc.setLineWidth(0.01);
    const gap = 0.15;
    const len = 0.5;
    const corners: [number, number, number, number][] = [
      [artX, artY, -1, -1],
      [artX + o.artW, artY, 1, -1],
      [artX, artY + o.artH, -1, 1],
      [artX + o.artW, artY + o.artH, 1, 1],
    ];
    for (const [x, y, dx, dy] of corners) {
      doc.line(x + dx * gap, y, x + dx * (gap + len), y);
      doc.line(x, y + dy * gap, x, y + dy * (gap + len));
    }
  }

  // Quadrado de calibração 5 × 5 cm: no espaço livre da página ou numa segunda página.
  const sq = 5;
  const topSpace = artY - usable.y - 0.8;
  const leftSpace = artX - usable.x - 0.8;
  doc.setFontSize(8);
  doc.setTextColor(60);
  const drawSquare = (x: number, y: number, captionX: number, captionY: number, captionW: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.02);
    doc.rect(x, y, sq, sq);
    doc.text(doc.splitTextToSize(CALIBRATION_CAPTION, captionW), captionX, captionY);
  };
  if (topSpace >= sq + 0.2 && usable.w >= sq + 4) {
    drawSquare(usable.x, usable.y, usable.x + sq + 0.4, usable.y + 0.4, usable.w - sq - 0.4);
  } else if (leftSpace >= sq && usable.h >= sq + 2.5) {
    drawSquare(usable.x, usable.y, usable.x, usable.y + sq + 0.5, sq);
  } else {
    doc.setFontSize(7);
    doc.text("A página 2 tem o quadrado de calibração.", pageW / 2, pageH - pm / 2 - 0.25, {
      align: "center",
    });
    doc.addPage(o.sheet === "A4" ? "a4" : "letter", o.orientation);
    doc.setFontSize(10);
    drawSquare(usable.x, usable.y, usable.x, usable.y + sq + 0.6, Math.min(usable.w, 14));
  }

  // Rodapé fora da área da arte.
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Stúdio Velas Lucrativas · arte ${formatCm(o.artW)} × ${formatCm(o.artH)} cm · imprima em tamanho real (100%)`,
      pageW / 2,
      pageH - Math.max(0.3, pm / 2 - 0.1),
      { align: "center" },
    );
  }

  return doc.output("blob");
}
