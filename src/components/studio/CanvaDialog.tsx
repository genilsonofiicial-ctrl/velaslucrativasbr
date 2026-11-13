import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCm } from "@/lib/candle";

export function CanvaDialog({
  open,
  onClose,
  widthCm,
  heightCm,
}: {
  open: boolean;
  onClose: () => void;
  widthCm: number;
  heightCm: number;
}) {
  const w = formatCm(widthCm);
  const h = formatCm(heightCm);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Levar para o Canva</DialogTitle>
          <DialogDescription>O PNG da sua arte foi baixado. Agora é só seguir:</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3 text-sm">
          {[
            <>No Canva, clique em <strong>Criar um design</strong> → <strong>Tamanho personalizado</strong>.</>,
            <>Escolha <strong>centímetros</strong> e digite <strong>{w} × {h}</strong>.</>,
            <>Depois use <strong>Enviar arquivos</strong> e arraste o PNG para o design.</>,
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-gold text-sm font-semibold text-gold-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
        <Button asChild variant="gold" size="lg" className="w-full">
          <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer">
            Abrir o Canva <ExternalLink />
          </a>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
