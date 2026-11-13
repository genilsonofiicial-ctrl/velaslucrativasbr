import { useEffect, useRef } from "react";
import { ArrowRight, ChevronDown, Info, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { LIMITS, formatCm, type Mode, type Sheet } from "@/lib/candle";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { PRESETS, useCandleCalc, useStudio } from "@/stores/studio";
import { CmField } from "./CmField";
import { FitBadge } from "./FitBadge";

const MODES: { value: Mode; title: string; text: string }[] = [
  { value: "wrap", title: "Arte ao redor da vela inteira", text: "A estampa dá a volta completa." },
  { value: "front", title: "Só na frente", text: "A estampa cobre só uma parte." },
];

const SHEET_OPTIONS: { value: Sheet; label: string; size: string }[] = [
  { value: "A4", label: "A4", size: "21 × 29,7 cm" },
  { value: "LETTER", label: "Carta", size: "21,59 × 27,94 cm" },
];

export function StepMeasures() {
  const inputs = useStudio((s) => s.inputs);
  const setInputs = useStudio((s) => s.setInputs);
  const applyPreset = useStudio((s) => s.applyPreset);
  const toggleCircumference = useStudio((s) => s.toggleCircumference);
  const setStep = useStudio((s) => s.setStep);
  const calc = useCandleCalc();

  // calc_completed: uma vez por combinação válida, depois que a pessoa para de digitar.
  const lastTracked = useRef<string | null>(null);
  useEffect(() => {
    if (!calc.ok) return;
    const key = JSON.stringify(inputs);
    if (key === lastTracked.current) return;
    const t = setTimeout(() => {
      lastTracked.current = key;
      track("calc_completed", {
        mode: inputs.mode,
        sheet: inputs.sheet,
        fits: calc.result.fits,
        art_width_cm: Number(calc.result.artWidth.toFixed(2)),
        art_height_cm: Number(calc.result.artHeight.toFixed(2)),
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [calc, inputs]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card-soft p-5 md:p-6">
          <h2 className="text-xl font-semibold text-primary">Medidas da vela</h2>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold">Atalhos de velas comuns</p>
            <div className="-mx-1 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={inputs.presetId === p.id ? "wine" : "outline"}
                  onClick={() => applyPreset(p.id)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <CmField
                id="diametro"
                label={inputs.useCircumference ? "Circunferência" : "Diâmetro"}
                value={inputs.diameterText}
                onChange={(v) => setInputs({ diameterText: v })}
              />
              <button
                type="button"
                onClick={toggleCircumference}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                <RefreshCw className="size-3.5" />
                {inputs.useCircumference ? "Tenho o diâmetro" : "Tenho a circunferência"}
              </button>
            </div>
            <CmField
              id="altura"
              label="Altura"
              value={inputs.heightText}
              onChange={(v) => setInputs({ heightText: v })}
            />
            <CmField
              id="margem"
              label="Margem de segurança"
              value={inputs.marginText}
              onChange={(v) => setInputs({ marginText: v })}
            />
          </div>

          <p className="mt-4 flex gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>
              Meça o diâmetro com uma fita métrica ou paquímetro. Se só tiver a circunferência,
              preencha aqui. A margem fica livre em todos os lados da arte.
            </span>
          </p>
        </section>

        <section className="card-soft p-5 md:p-6">
          <h2 className="text-xl font-semibold text-primary">Onde vai a arte?</h2>
          <div role="radiogroup" aria-label="Onde vai a arte" className="mt-4 grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => {
              const active = inputs.mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setInputs({ mode: m.value, presetId: inputs.presetId })}
                  className={cn(
                    "focus-ring rounded-2xl border-2 p-4 text-left transition-colors",
                    active ? "border-gold bg-accent" : "border-border bg-card hover:border-gold/50",
                  )}
                >
                  <span className="block font-semibold text-primary">{m.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{m.text}</span>
                </button>
              );
            })}
          </div>

          {inputs.mode === "front" && (
            <div className="mt-5 rounded-2xl bg-muted p-4">
              <div className="flex items-center justify-between">
                <label htmlFor="angulo" className="text-sm font-semibold">
                  Quanto da vela a arte cobre
                </label>
                <span className="font-display text-xl font-semibold text-primary">
                  {inputs.arcDegrees}°
                </span>
              </div>
              <Slider
                id="angulo"
                className="mt-4"
                min={LIMITS.arc.min}
                max={LIMITS.arc.max}
                step={5}
                value={[inputs.arcDegrees]}
                onValueChange={([v]) => v !== undefined && setInputs({ arcDegrees: v, presetId: inputs.presetId })}
                aria-label="Ângulo da arte"
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>{LIMITS.arc.min}° (estreita)</span>
                <span>{LIMITS.arc.max}° (larga)</span>
              </div>
            </div>
          )}
        </section>

        <section className="card-soft p-5 md:p-6">
          <h2 className="text-xl font-semibold text-primary">Folha para imprimir</h2>
          <div role="radiogroup" aria-label="Folha" className="mt-4 grid grid-cols-2 gap-3">
            {SHEET_OPTIONS.map((o) => {
              const active = inputs.sheet === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setInputs({ sheet: o.value, presetId: inputs.presetId })}
                  className={cn(
                    "focus-ring rounded-2xl border-2 p-4 text-left transition-colors",
                    active ? "border-gold bg-accent" : "border-border bg-card hover:border-gold/50",
                  )}
                >
                  <span className="block font-semibold text-primary">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.size}</span>
                </button>
              );
            })}
          </div>

          <Collapsible className="mt-4">
            <CollapsibleTrigger className="focus-ring group inline-flex items-center gap-1 rounded-full text-sm font-semibold text-primary">
              Opções avançadas
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 max-w-xs space-y-1">
              <CmField
                id="margem-folha"
                label="Margem da folha/fita"
                value={inputs.printerMarginText}
                onChange={(v) => setInputs({ printerMarginText: v, presetId: inputs.presetId })}
              />
              <p className="text-xs text-muted-foreground">
                Espaço em cada borda da folha para a fita e a impressora. Padrão: 1 cm.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card-soft p-5 md:p-6" aria-live="polite">
          <h2 className="text-xl font-semibold text-primary">Resultado</h2>
          {calc.ok ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <ResultCard label="Largura da arte" value={formatCm(calc.result.artWidth)} highlight />
                <ResultCard label="Altura da arte" value={formatCm(calc.result.artHeight)} highlight />
                <div className="col-span-2">
                  <ResultCard label="Circunferência da vela" value={formatCm(calc.result.circumference)} />
                </div>
              </div>
              <div className="mt-4">
                <FitBadge result={calc.result} sheet={inputs.sheet} />
              </div>
              {calc.result.warnings.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {calc.result.warnings.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <ul className="mt-4 space-y-2 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
              {calc.errors.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}
          <Button
            variant="gold"
            size="lg"
            className="mt-6 w-full"
            disabled={!calc.ok}
            onClick={() => setStep(2)}
          >
            Escolher a arte <ArrowRight />
          </Button>
        </div>
      </aside>
    </div>
  );
}

function ResultCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-4", highlight ? "bg-gradient-wine text-wine-foreground" : "bg-muted")}>
      <p className={cn("text-xs font-medium", highlight ? "text-wine-foreground/80" : "text-muted-foreground")}>
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-semibold md:text-3xl">
        {value} <span className="text-base font-sans font-normal">cm</span>
      </p>
    </div>
  );
}
