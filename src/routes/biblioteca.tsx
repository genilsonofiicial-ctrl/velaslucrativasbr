import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/PageHeader";
import { TemplateBrowser } from "@/components/library/TemplateBrowser";
import { track } from "@/lib/analytics";
import { useStudio } from "@/stores/studio";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de modelos — Stúdio Velas Lucrativas" },
      {
        name: "description",
        content: "Estampas para velas de Natal, casamento, bebê, festas, datas especiais e mais.",
      },
      { property: "og:title", content: "Biblioteca de modelos — Stúdio Velas Lucrativas" },
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
  const navigate = useNavigate();
  const selectTemplate = useStudio((s) => s.selectTemplate);
  const setStep = useStudio((s) => s.setStep);
  const template = useStudio((s) => s.template);
  const inputs = useStudio((s) => s.inputs);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        eyebrow="Biblioteca"
        title="Modelos de estampa"
        description="Toque em um modelo para ver maior e levar para a sua vela. Funciona sem login."
      />
      <TemplateBrowser
        selectedId={template?.id}
        onUse={(t) => {
          if (!t.image_path) {
            toast.error("Este modelo está sem imagem.");
            return;
          }
          selectTemplate({
            id: t.id,
            title: t.title,
            theme: t.theme,
            imagePath: t.image_path,
            isPremium: t.is_premium,
          });
          track("template_selected", {
            template_id: t.id,
            template_title: t.title,
            theme: t.theme,
            premium: t.is_premium,
            mode: inputs.mode,
            sheet: inputs.sheet,
            from: "biblioteca",
          });
          setStep(3);
          toast.success(`“${t.title}” está no estúdio. Suas medidas foram mantidas.`);
          navigate({ to: "/estudio" });
        }}
      />
    </div>
  );
}
