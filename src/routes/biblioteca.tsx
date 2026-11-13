import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de modelos — Stúdio Velas Lucrativas" },
      { name: "description", content: "Estampas prontas para velas: florais, datas especiais e mais." },
      { property: "og:title", content: "Biblioteca de modelos — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Estampas prontas para velas: florais, datas especiais e mais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Biblioteca,
});

const FILTROS = ["Todos", "Floral", "Casamento", "Natal", "Religioso", "Dia das Mães"];

// Exemplos visuais até os modelos reais serem cadastrados.
const EXEMPLOS = [
  { title: "Rosas vintage", theme: "Floral", premium: false, tone: "bg-gradient-wine" },
  { title: "Arabesco dourado", theme: "Casamento", premium: true, tone: "bg-gradient-gold" },
  { title: "Ramos de inverno", theme: "Natal", premium: false, tone: "bg-secondary" },
  { title: "Lavanda delicada", theme: "Floral", premium: false, tone: "bg-accent" },
  { title: "Terço e flores", theme: "Religioso", premium: true, tone: "bg-gradient-wine" },
  { title: "Para você, mãe", theme: "Dia das Mães", premium: false, tone: "bg-gradient-gold" },
];

function Biblioteca() {
  const [filtro, setFiltro] = useState("Todos");
  const lista = filtro === "Todos" ? EXEMPLOS : EXEMPLOS.filter((e) => e.theme === filtro);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Biblioteca"
        title="Modelos de estampa"
        description="Escolha um modelo e leve para o estúdio. Funciona sem login."
      />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTROS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={f === filtro ? "wine" : "outline"}
            onClick={() => setFiltro(f)}
            className="shrink-0"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {lista.map((item) => (
          <article key={item.title} className="card-soft overflow-hidden">
            <div className={`relative aspect-[4/5] ${item.tone}`}>
              {item.premium && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-primary shadow-soft">
                  <Crown className="size-3 text-gold" /> Pro
                </span>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-sans text-sm font-semibold text-foreground md:text-base">
                {item.title}
              </h2>
              <p className="text-xs text-muted-foreground">{item.theme}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Estes são exemplos.{" "}
        <Link to="/estudio" className="font-semibold text-primary underline underline-offset-4">
          Ir para o estúdio
        </Link>
      </p>
    </div>
  );
}
