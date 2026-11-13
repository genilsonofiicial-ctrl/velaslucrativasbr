import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  FlipHorizontal2,
  Grid3x3,
  Maximize,
  Minimize,
  Minus,
  Plus,
  RotateCw,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArtImage } from "@/hooks/useArtImage";
import { SCALE_LIMITS, type FitMode, type Rotation } from "@/lib/art-render";
import { formatNumber } from "@/lib/candle";
import { cn } from "@/lib/utils";
import { parseStudioInputs, useCandleCalc, useStudio } from "@/stores/studio";
import { ArtPreview } from "./ArtPreview";
import { CylinderPreview } from "./CylinderPreview";

const FITS: { value: FitMode; label: string; icon: typeof Maximize }[] = [
  { value: "contain", label: "Ajustar à área", icon: Minimize },
  { value: "cover", label: "Preencher a área", icon: Maximize },
  { value: "tile", label: "Repetir como padrão", icon: Grid3x3 },
];

export function StepAdjust() {
  const calc = useCandleCalc();
  const inputs = useStudio((s) => s.inputs);
  const transform = useStudio((s) => s.transform);
  const history = useStudio((s) => s.history);
  const updateTransform = useStudio((s) => s.updateTransform);
  const pushHistory = useStudio((s) => s.pushHistory);
  const undo = useStudio((s) => s.undo);
  const center = useStudio((s) => s.center);
  const setStep = useStudio((s) => s.setStep);
  const art = useArtImage();
  const parsed = parseStudioInputs(inputs);

  // "Repetir como padrão" só existe no modo ao redor da vela.
  useEffect(() => {
    if (inputs.mode === "front" && transform.fit === "tile") updateTransform({ fit: "contain" }, { history: false });
  }, [inputs.mode, transform.fit, updateTransform]);

  if (!calc.ok || !parsed.input) {
    return (
      <div className="card-soft p-8 text-center">
        <p className="font-semibold text-primary">Confira as medidas primeiro.</p>
        <Button variant="gold" className="mt-4" onClick={() => setStep(1)}>
          Ir para Medidas
        </Button>
      </div>
    );
  }

  const setScale = (v: number) =>
    updateTransform({ scale: Math.min(SCALE_LIMITS.max, Math.max(SCALE_LIMITS.min, Number(v.toFixed(2)))) });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="card-soft min-w-0 p-4 md:p-6">
        <Tabs defaultValue="plana">
          <TabsList className="mb-4 grid w-full grid-cols-2 rounded-full bg-muted p-1 sm:w-80">
            <TabsTrigger value="plana" className="rounded-full">
              Vela aberta
            </TabsTrigger>
            <TabsTrigger value="vela" className="rounded-full">
              Prévia na vela
            </TabsTrigger>
          </TabsList>
          <TabsContent value="plana">
            <ArtPreview image={art.image} loading={art.loading} result={calc.result} heightCm={parsed.input.heightCm} />
            <p className="mt-2 text-center text-xs text-muted-foreground">Arraste a imagem para mover.</p>
          </TabsContent>
          <TabsContent value="vela">
            <CylinderPreview
              image={art.image}
              result={calc.result}
              diameterCm={parsed.input.diameterCm}
              heightCm={parsed.input.heightCm}
              mode={inputs.mode}
              transform={transform}
            />
          </TabsContent>
        </Tabs>
      </section>

      <aside className="card-soft space-y-6 p-5 md:p-6 lg:sticky lg:top-24 lg:self-start">
        <div>
          <p className="mb-2 text-sm font-semibold">Encaixe</p>
          <div className="grid gap-2">
            {FITS.map((f) => {
              const disabled = f.value === "tile" && inputs.mode === "front";
              const active = transform.fit === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => updateTransform({ fit: f.value, scale: 1, x: 0, y: 0 })}
                  className={cn(
                    "focus-ring flex min-h-11 items-center gap-3 rounded-xl border-2 px-4 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    active ? "border-gold bg-accent text-primary" : "border-border hover:border-gold/50",
                  )}
                >
                  <f.icon className="size-4 text-gold" />
                  {f.label}
                  {disabled && <span className="ml-auto text-xs text-muted-foreground">só ao redor</span>}
                </button>
              );
            })}
          </div>
        </div>

        {transform.fit === "tile" && (
          <div>
            <div className="flex justify-between text-sm">
              <Label htmlFor="bloco" className="font-semibold">
                Tamanho do bloco
              </Label>
              <span className="font-semibold text-primary">{formatNumber(transform.tileCm, 1)} cm</span>
            </div>
            <Slider
              id="bloco"
              className="mt-3"
              min={1}
              max={15}
              step={0.5}
              value={[transform.tileCm]}
              onPointerDown={pushHistory}
              onValueChange={([v]) => v !== undefined && updateTransform({ tileCm: v }, { history: false })}
              aria-label="Tamanho do bloco"
            />
          </div>
        )}

        <div>
          <div className="flex justify-between text-sm">
            <Label htmlFor="escala" className="font-semibold">
              Tamanho
            </Label>
            <span className="font-semibold text-primary">{Math.round(transform.scale * 100)}%</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button size="icon" variant="outline" aria-label="Diminuir" onClick={() => setScale(transform.scale - 0.1)}>
              <Minus />
            </Button>
            <Slider
              id="escala"
              min={SCALE_LIMITS.min}
              max={SCALE_LIMITS.max}
              step={SCALE_LIMITS.step}
              value={[transform.scale]}
              onPointerDown={pushHistory}
              onValueChange={([v]) => v !== undefined && updateTransform({ scale: v }, { history: false })}
              aria-label="Tamanho da imagem"
            />
            <Button size="icon" variant="outline" aria-label="Aumentar" onClick={() => setScale(transform.scale + 0.1)}>
              <Plus />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => updateTransform({ rotation: ((transform.rotation + 90) % 360) as Rotation })}
          >
            <RotateCw /> Girar 90°
          </Button>
          <Button variant="outline" onClick={center}>
            <Crosshair /> Centralizar
          </Button>
          <Button variant="outline" onClick={undo} disabled={history.length === 0} className="col-span-2">
            <Undo2 /> Desfazer
          </Button>
        </div>

        <div className="rounded-2xl bg-muted p-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="espelhar" className="flex items-center gap-2 font-semibold">
              <FlipHorizontal2 className="size-4 text-gold" /> Espelhar
            </Label>
            <Switch
              id="espelhar"
              checked={transform.mirror}
              onCheckedChange={(v) => updateTransform({ mirror: v })}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Se a sua estampa tiver letras, faça um teste para ver se precisa espelhar.
          </p>
        </div>

        <div className="flex justify-between gap-3">
          <Button variant="outline" onClick={() => setStep(2)}>
            <ArrowLeft /> Arte
          </Button>
          <Button variant="gold" disabled={!art.image} onClick={() => setStep(4)}>
            Exportar <ArrowRight />
          </Button>
        </div>
      </aside>
    </div>
  );
}
