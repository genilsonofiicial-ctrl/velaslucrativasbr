import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useStudio, type Step } from "@/stores/studio";

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Medidas" },
  { n: 2, label: "Arte" },
  { n: 3, label: "Ajustar" },
  { n: 4, label: "Exportar" },
];

export function StudioProgress() {
  const step = useStudio((s) => s.step);
  const setStep = useStudio((s) => s.setStep);
  const pct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <nav aria-label="Etapas do estúdio" className="mb-8">
      <div className="relative">
        <div className="absolute left-5 right-5 top-5 h-1 rounded-full bg-muted" aria-hidden />
        <div
          className="absolute left-5 top-5 h-1 rounded-full bg-gradient-gold transition-all duration-500"
          style={{ width: `calc((100% - 2.5rem) * ${pct / 100})` }}
          aria-hidden
        />
        <ol className="relative flex justify-between">
          {STEPS.map((s) => {
            const done = s.n < step;
            const current = s.n === step;
            return (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => setStep(s.n)}
                  aria-current={current ? "step" : undefined}
                  className="focus-ring flex flex-col items-center gap-1.5 rounded-xl"
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border-2 font-semibold transition-colors",
                      current && "border-gold bg-gradient-gold text-gold-foreground shadow-soft",
                      done && "border-primary bg-primary text-primary-foreground",
                      !current && !done && "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-5" /> : s.n}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium sm:text-sm",
                      current ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
