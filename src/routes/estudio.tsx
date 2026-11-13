import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Move, Palette, Ruler } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/estudio")({
  head: () => ({
    meta: [
      { title: "Estúdio de criação — Stúdio Velas Lucrativas" },
      { name: "description", content: "Monte a estampa da sua vela em 4 etapas simples." },
      { property: "og:title", content: "Estúdio de criação — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Monte a estampa da sua vela em 4 etapas simples." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Estudio,
});

const ETAPAS = [
  { icon: Ruler, title: "Medidas da vela", text: "Diâmetro e altura, em centímetros." },
  { icon: Palette, title: "Estampa", text: "Escolha um modelo ou envie sua imagem." },
  { icon: Move, title: "Ajustes", text: "Posição, tamanho e repetição." },
  { icon: Download, title: "Baixar", text: "Arquivo pronto para A4 ou Carta." },
];

function Estudio() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow="Estúdio"
        title="Vamos criar sua vela"
        description="São só 4 etapas. Você pode criar sem fazer login."
      />

      <ol className="grid gap-3 sm:grid-cols-2">
        {ETAPAS.map((etapa, i) => (
          <li key={etapa.title} className="card-soft flex items-start gap-4 p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-gold font-display text-lg font-semibold text-gold-foreground">
              {i + 1}
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-primary">
                <etapa.icon className="size-4 text-gold" /> {etapa.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{etapa.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="card-soft mt-6 p-8 text-center">
        <p className="font-display text-xl text-primary">O assistente está sendo preparado</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Enquanto isso, veja os modelos e aprenda a técnica.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild variant="gold">
            <Link to="/biblioteca">Ver modelos</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/guia">Abrir o guia</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
