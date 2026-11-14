import { useEffect, useRef } from "react";
import { ArrowRight, ChevronDown, Info, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { LIMITS, formatCm, type Mode, type Sheet } from "@/lib/candle";
import { track } from "@/lib/analytics";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";
import { cn } from "@/lib/utils";
import { calcFromInputs, PRESETS, useCandleCalc, useStudio, type StudioInputs } from "@/stores/studio";
import { useWebMCP } from "use-webmcp-tool";
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

  function changeInputs(patch: Partial<StudioInputs>) {
    setInputs(patch);
  }

  useWebMCP({
    name: "get_candle_measurements",
    description: "Lê as medidas atuais da etapa Medidas e o resultado do cálculo sem alterar a tela.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => runWebMCPTool("get_candle_measurements", () => {
      const base = `Diâmetro: ${inputs.diameterText} cm; altura: ${inputs.heightText} cm; margem: ${inputs.marginText} cm; modo: ${inputs.mode}; folha: ${inputs.sheet}.`;
      if (!calc.ok) return `${base} Corrija: ${calc.errors.join(" ")}`;
      return `${base} Arte: ${formatCm(calc.result.artWidth)} × ${formatCm(calc.result.artHeight)} cm; circunferência: ${formatCm(calc.result.circumference)} cm; cabe na folha: ${calc.result.fits ? "sim" : "não"}.`;
    }),
  });

  useWebMCP({
    name: "set_candle_measurements",
    description: "Atualiza as medidas visíveis da vela depois de validar todos os valores informados.",
    annotations: { untrustedContentHint: true },
    inputSchema: {
      type: "object",
      properties: {
        diameter_cm: { type: "number", description: "Novo diâmetro em centímetros, de 2 a 20." },
        height_cm: { type: "number", description: "Nova altura em centímetros, de 3 a 40." },
        margin_cm: { type: "number", description: "Nova margem de segurança em centímetros, de 0 a 3." },
        mode: { type: "string", enum: ["wrap", "front"], description: "wrap para a volta inteira ou front para só a frente." },
        arc_degrees: { type: "number", description: "Novo arco em graus, de 60 a 240." },
        sheet: { type: "string", enum: ["A4", "LETTER"], description: "Folha A4 ou Carta." },
        printer_margin_cm: { type: "number", description: "Nova margem da folha em centímetros, de 0 a 5." },
      },
    },
    execute: (args: {
      diameter_cm?: number;
      height_cm?: number;
      margin_cm?: number;
      mode?: Mode;
      arc_degrees?: number;
      sheet?: Sheet;
      printer_margin_cm?: number;
    }) => runWebMCPTool("set_candle_measurements", () => {
      const patch: Partial<StudioInputs> = {};
      const numberPatch = (
        value: unknown,
        key: "diameterText" | "heightText" | "marginText" | "printerMarginText",
        min: number,
        max: number,
        label: string,
      ) => {
        if (value === undefined) return;
        if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
          throw new Error(`${label} deve ser um número entre ${min} e ${max}.`);
        }
        patch[key] = String(value).replace(".", ",");
      };
      numberPatch(args.diameter_cm, "diameterText", LIMITS.diameter.min, LIMITS.diameter.max, "O diâmetro");
      if (args.diameter_cm !== undefined) patch.useCircumference = false;
      numberPatch(args.height_cm, "heightText", LIMITS.height.min, LIMITS.height.max, "A altura");
      numberPatch(args.margin_cm, "marginText", LIMITS.margin.min, LIMITS.margin.max, "A margem");
      numberPatch(args.printer_margin_cm, "printerMarginText", LIMITS.printerMargin.min, LIMITS.printerMargin.max, "A margem da folha");
      if (args.mode !== undefined) {
        if (args.mode !== "wrap" && args.mode !== "front") throw new Error("Modo desconhecido; use wrap ou front.");
        patch.mode = args.mode;
      }
      if (args.sheet !== undefined) {
        if (args.sheet !== "A4" && args.sheet !== "LETTER") throw new Error("Folha desconhecida; use A4 ou LETTER.");
        patch.sheet = args.sheet;
      }
      if (args.arc_degrees !== undefined) {
        if (typeof args.arc_degrees !== "number" || !Number.isFinite(args.arc_degrees) || args.arc_degrees < LIMITS.arc.min || args.arc_degrees > LIMITS.arc.max) {
          throw new Error(`O arco deve ficar entre ${LIMITS.arc.min} e ${LIMITS.arc.max} graus.`);
        }
        patch.arcDegrees = args.arc_degrees;
      }
      const next = { ...inputs, ...patch };
      const nextCalc = calcFromInputs(next);
      if (!nextCalc.ok) throw new Error(nextCalc.errors.join(" "));
      changeInputs(patch);
      return `Medidas atualizadas. Arte: ${formatCm(nextCalc.result.artWidth)} × ${formatCm(nextCalc.result.artHeight)} cm; cabe na folha: ${nextCalc.result.fits ? "sim" : "não"}.`;
    }),
  });

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
                onChange={(v) => changeInputs({ diameterText: v })}
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
              onChange={(v) => changeInputs({ heightText: v })}
            />
            <CmField
              id="margem"
              label="Margem de segurança"
              value={inputs.marginText}
              onChange={(v) => changeInputs({ marginText: v })}
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
                  onClick={() => changeInputs({ mode: m.value, presetId: inputs.presetId })}
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
                onValueChange={([v]) => v !== undefined && changeInputs({ arcDegrees: v, presetId: inputs.presetId })}
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
                  onClick={() => changeInputs({ sheet: o.value, presetId: inputs.presetId })}
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
                onChange={(v) => changeInputs({ printerMarginText: v, presetId: inputs.presetId })}
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
