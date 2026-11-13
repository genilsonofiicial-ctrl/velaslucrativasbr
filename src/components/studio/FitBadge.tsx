import { CheckCircle2, XCircle } from "lucide-react";

import { SHEETS, orientationLabel, type CandleResult, type Sheet } from "@/lib/candle";

export function FitBadge({ result, sheet }: { result: CandleResult; sheet: Sheet }) {
  const name = SHEETS[sheet].label;
  if (result.fits && result.orientation) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-success-soft px-4 py-2 text-sm font-semibold text-success">
        <CheckCircle2 className="size-5" />
        Cabe na folha {name} ({orientationLabel(result.orientation)})
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-2xl bg-destructive-soft px-4 py-3 text-sm text-destructive">
      <XCircle className="mt-0.5 size-5 shrink-0" />
      <span>
        <strong className="block">Não cabe na folha {name}</strong>
        {result.message}
      </span>
    </div>
  );
}
