import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, Palette, Ruler, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import heroImage from "@/assets/velas-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stúdio Velas Lucrativas — estampas para velas em papel de seda" },
      {
        name: "description",
        content:
          "Calcule as medidas da sua vela, escolha a estampa e baixe pronta para imprimir em papel de seda.",
      },
      { property: "og:title", content: "Stúdio Velas Lucrativas" },
      {
        property: "og:description",
        content: "Estampas para velas com medida certa, prontas para imprimir em papel de seda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  {
    icon: Ruler,
    title: "Calcule as medidas",
    text: "Informe o tamanho da vela e saiba o tamanho exato da estampa.",
  },
  {
    icon: Palette,
    title: "Escolha a estampa",
    text: "Use um modelo da biblioteca ou envie a sua própria arte.",
  },
  {
    icon: Download,
    title: "Baixe pronto para imprimir",
    text: "Receba o arquivo no tamanho da folha, é só imprimir.",
  },
];

function Index() {
  return (
    <>
      <section className="bg-gradient-wine text-wine-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-8 md:grid-cols-2 md:gap-12 md:py-20">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="ornament text-xs font-semibold uppercase tracking-[0.2em] text-gold-light">
              Velas personalizadas
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Estampas lindas, <span className="text-gold-light italic">na medida certa</span>
            </h1>
            <p className="mt-4 max-w-md text-lg text-wine-foreground/85">
              Crie a estampa da sua vela, ajuste o tamanho e imprima em papel de seda sem errar.
            </p>
            <Button asChild variant="gold" size="lg" className="mt-8">
              <Link to="/estudio">
                Começar a criar <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] border border-gold/40" aria-hidden />
            <img
              src={heroImage}
              alt="Velas decoradas com estampas florais e detalhes dourados"
              width={1280}
              height={960}
              className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="text-center text-2xl font-semibold text-primary md:text-3xl">
          Como funciona
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <article key={step.title} className="card-soft p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                  <step.icon className="size-6" />
                </span>
                <span className="font-display text-3xl font-semibold text-gold">{i + 1}</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-primary">{step.title}</h3>
              <p className="mt-1.5 text-muted-foreground">{step.text}</p>
            </article>
          ))}
        </div>

        <aside className="mt-8 flex gap-4 rounded-2xl border border-gold/50 bg-accent p-5">
          <ShieldCheck className="size-6 shrink-0 text-primary" />
          <div>
            <h3 className="font-sans text-base font-semibold text-primary">Segurança em primeiro lugar</h3>
            <p className="mt-1 text-sm text-foreground/80">
              A estampa é decorativa. Nunca deixe a chama encostar no papel e não deixe a vela acesa
              sem ninguém por perto.{" "}
              <Link to="/guia" className="font-semibold text-primary underline underline-offset-4">
                Ver o guia
              </Link>
            </p>
          </div>
        </aside>
      </section>
    </>
  );
}
