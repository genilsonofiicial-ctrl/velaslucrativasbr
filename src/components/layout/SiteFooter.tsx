import { Info } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="flex items-start gap-2">
          <Info className="mt-0.5 size-4 shrink-0 text-gold" />
          <span>
            Ferramenta de apoio. Os resultados dependem da sua impressora, do papel e da vela. Faça
            sempre um teste antes de produzir em quantidade.
          </span>
        </p>
        <p className="shrink-0 font-display text-primary">Stúdio Velas Lucrativas</p>
      </div>
    </footer>
  );
}
