import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, Flame, Layers, ShieldAlert, TriangleAlert, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/guia")({
  head: () => ({
    meta: [
      { title: "Guia da técnica e segurança — Stúdio Velas Lucrativas" },
      {
        name: "description",
        content:
          "Materiais, passo a passo, erros comuns e cuidados para estampar velas com papel de seda, em linguagem simples.",
      },
      { property: "og:title", content: "Guia: como estampar velas com papel de seda" },
      {
        property: "og:description",
        content: "Materiais, passo a passo, erros comuns e cuidados de segurança.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Guia,
});

const MATERIAIS = [
  "Impressora jato de tinta",
  "Papel de seda branco",
  "Folha de papel comum ou cartolina branca (serve de base para imprimir)",
  "Fita adesiva",
  "Papel manteiga (papel-vegetal encerado)",
  "Pistola de ar quente (ou secador de cabelo, que é mais lento)",
  "Fita métrica",
  "Tesoura",
  "Vela de cera de verdade, de preferência cilíndrica",
];

const PASSOS = [
  { t: "Meça a vela", d: "Use a fita métrica para o diâmetro (ou a volta) e a altura." },
  { t: "Calcule a arte no estúdio", d: "Digite as medidas e veja o tamanho exato da estampa." },
  { t: "Prenda o papel de seda na folha", d: "Estique bem e passe fita em todas as bordas, sem dobras." },
  { t: "Imprima em tamanho real (100%)", d: "Nada de “ajustar à página”. Confira o quadrado de 5 cm com a régua." },
  { t: "Recorte a arte", d: "Corte seguindo as marcas dos cantos, separando o papel de seda da folha." },
  { t: "Posicione na vela", d: "Encoste a arte na vela, com o lado impresso para fora, sem bolhas." },
  { t: "Cubra com papel manteiga", d: "Enrole o papel manteiga bem justo por cima da arte." },
  { t: "Aqueça com a pistola", d: "Movimente sempre, até a imagem ficar nítida e as bordas do papel sumirem." },
  { t: "Retire o papel manteiga", d: "Puxe com calma enquanto ainda está morno e deixe a vela esfriar em pé." },
];

const ERROS = [
  { t: "Imprimir com “ajustar à página”", d: "A arte sai menor e não fecha na vela. Imprima sempre em 100%." },
  { t: "Papel de seda mal preso", d: "Ele enrosca na impressora. Prenda todas as bordas com fita." },
  { t: "Calor demais", d: "A cera escorre e a imagem borra. Mantenha a pistola em movimento e afastada." },
  { t: "Arte colada na borda da vela", d: "Fica feio e perto do pavio. Respeite a margem de segurança." },
  { t: "Vela muito texturizada", d: "O papel não assenta. Prefira velas de superfície lisa." },
];

function Guia() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        eyebrow="Guia"
        title="Como estampar velas com papel de seda"
        description="Um passo a passo simples, do material ao acabamento — com segurança."
      />

      <aside
        role="note"
        aria-label="Segurança"
        className="mb-10 rounded-2xl border-2 border-destructive/40 bg-destructive-soft p-5 shadow-soft"
      >
        <h2 className="flex items-center gap-2 font-sans text-base font-bold text-destructive">
          <ShieldAlert className="size-5" /> Segurança
        </h2>
        <p className="mt-2 text-sm text-foreground/90">
          A pistola de ar quente chega a temperaturas muito altas. Use luvas, prenda cabelos longos, nunca
          apoie a pistola ligada, não use perto de materiais inflamáveis e guarde só depois de esfriar.
          Deixe uma margem livre ao redor do pavio e oriente o cliente a não acender a vela com papel por
          perto.
        </p>
      </aside>

      <section aria-labelledby="materiais" className="mb-12">
        <h2 id="materiais" className="flex items-center gap-3 text-2xl font-semibold text-primary">
          <Wrench className="size-6 text-gold" /> O que você vai precisar
        </h2>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {MATERIAIS.map((m) => (
            <li key={m} className="card-soft flex items-start gap-3 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              {m}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex gap-2 rounded-xl bg-accent p-4 text-sm text-primary">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gold" />
          Não funciona em vela de LED sem cera na superfície.
        </p>
      </section>

      <section aria-labelledby="passos" className="mb-12">
        <h2 id="passos" className="flex items-center gap-3 text-2xl font-semibold text-primary">
          <Flame className="size-6 text-gold" /> Passo a passo em resumo
        </h2>
        <ol className="mt-5 space-y-4">
          {PASSOS.map((p, i) => (
            <li key={p.t} className="card-soft grid gap-4 p-4 sm:grid-cols-[1fr_200px] sm:items-center">
              <div className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-gold font-display text-lg font-semibold text-gold-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-sans text-base font-semibold text-primary">{p.t}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{p.d}</p>
                </div>
              </div>
              <figure className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-muted-foreground">
                <Camera className="size-6" aria-hidden />
                <figcaption className="mt-1 text-xs">Foto do passo {i + 1}</figcaption>
              </figure>
            </li>
          ))}
        </ol>
        <div className="mt-6 text-center">
          <Button asChild variant="gold" size="lg">
            <Link to="/estudio">Calcular minha arte agora</Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="metodos" className="mb-12">
        <h2 id="metodos" className="flex items-center gap-3 text-2xl font-semibold text-primary">
          <Layers className="size-6 text-gold" /> Dois métodos
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="card-soft p-5">
            <h3 className="font-sans text-base font-semibold text-primary">Estampa impressa em papel de seda</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Você escolhe ou cria a arte, imprime no papel de seda preso à folha e aplica com calor. Dá
              para personalizar com nomes, datas e qualquer desenho, sempre na medida da vela.
            </p>
          </article>
          <article className="card-soft p-5">
            <h3 className="font-sans text-base font-semibold text-primary">
              Papel de seda decorativo ou guardanapo estampado
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sem impressora: use um papel de seda já estampado ou a camada de cima de um guardanapo
              decorado. Recorte no tamanho calculado e aplique do mesmo jeito.
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="erros">
        <h2 id="erros" className="flex items-center gap-3 text-2xl font-semibold text-primary">
          <TriangleAlert className="size-6 text-gold" /> Erros comuns
        </h2>
        <ul className="mt-5 space-y-3">
          {ERROS.map((e) => (
            <li key={e.t} className="card-soft p-4">
              <p className="font-semibold text-primary">{e.t}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{e.d}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
