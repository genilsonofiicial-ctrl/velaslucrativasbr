import { createFileRoute } from "@tanstack/react-router";
import { Flame, Printer, ShieldCheck } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/guia")({
  head: () => ({
    meta: [
      { title: "Guia da técnica e segurança — Stúdio Velas Lucrativas" },
      {
        name: "description",
        content: "Aprenda a aplicar estampas de papel de seda em velas com segurança.",
      },
      { property: "og:title", content: "Guia da técnica e segurança" },
      {
        property: "og:description",
        content: "Aprenda a aplicar estampas de papel de seda em velas com segurança.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Guia,
});

const SECOES = [
  {
    icon: Printer,
    title: "Materiais",
    itens: [
      "Vela branca ou clara, de superfície lisa.",
      "Papel de seda branco e uma folha sulfite (A4 ou Carta).",
      "Fita adesiva, papel manteiga e soprador térmico ou secador.",
    ],
  },
  {
    icon: Flame,
    title: "Passo a passo",
    itens: [
      "Cole o papel de seda na folha sulfite com fita, sem dobras.",
      "Imprima a estampa e recorte no tamanho indicado.",
      "Envolva a vela, cubra com papel manteiga e aqueça até a estampa fixar.",
      "Retire o papel manteiga com cuidado e deixe esfriar.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Segurança",
    itens: [
      "Deixe uma margem sem estampa perto do pavio.",
      "Nunca deixe a vela acesa sem ninguém por perto.",
      "Mantenha longe de crianças, animais e cortinas.",
      "Faça sempre uma vela de teste antes de vender.",
    ],
  },
];

function Guia() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow="Guia"
        title="A técnica, passo a passo"
        description="O básico para estampar velas com papel de seda — com segurança."
      />
      <Accordion type="single" collapsible defaultValue="Materiais" className="space-y-3">
        {SECOES.map((secao) => (
          <AccordionItem key={secao.title} value={secao.title} className="card-soft border-none px-5">
            <AccordionTrigger className="text-base font-semibold text-primary hover:no-underline">
              <span className="flex items-center gap-3">
                <secao.icon className="size-5 text-gold" /> {secao.title}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 pb-2">
                {secao.itens.map((item) => (
                  <li key={item} className="flex gap-3 text-foreground/85">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
