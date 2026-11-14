import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/PageHeader";
import { TemplateBrowser } from "@/components/library/TemplateBrowser";
import { useStudio } from "@/stores/studio";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Packs de estampas — Stúdio Velas Lucrativas" },
      {
        name: "description",
        content: "Estampas para velas de Natal, casamento, bebê, festas, datas especiais e mais.",
      },
      { property: "og:title", content: "Packs de estampas — Stúdio Velas Lucrativas" },
      {
        property: "og:description",
        content: "Estampas para velas de Natal, casamento, bebê, festas, datas especiais e mais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Biblioteca,
});

function Biblioteca() {
  const template = useStudio((s) => s.template);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Biblioteca"
        title="Packs de estampas"
        description="Cada pack traz de 3 a 6 estampas do mesmo tema. Abra um pack para ver tudo."
      />
      <TemplateBrowser selectedId={template?.packId ?? template?.id} />
    </div>
  );
}
