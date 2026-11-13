import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { StudioProgress } from "@/components/studio/StudioProgress";
import { StepMeasures } from "@/components/studio/StepMeasures";
import { StepArt } from "@/components/studio/StepArt";
import { StepAdjust } from "@/components/studio/StepAdjust";
import { StepExport } from "@/components/studio/StepExport";
import { useStudio } from "@/stores/studio";

export const Route = createFileRoute("/estudio")({
  head: () => ({
    meta: [
      { title: "Estúdio de criação — Stúdio Velas Lucrativas" },
      {
        name: "description",
        content: "Calcule a medida da arte, escolha a estampa, ajuste na vela e baixe pronto para imprimir.",
      },
      { property: "og:title", content: "Estúdio de criação — Stúdio Velas Lucrativas" },
      {
        property: "og:description",
        content: "Calcule a medida da arte, escolha a estampa, ajuste na vela e baixe pronto para imprimir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Estudio,
});

const TITLES = {
  1: { title: "Medidas da vela", text: "Informe o tamanho e veja na hora a medida da arte." },
  2: { title: "Escolha a arte", text: "Use um modelo ou envie a sua própria imagem." },
  3: { title: "Ajuste na vela", text: "Mova, aumente ou repita a estampa dentro da área segura." },
  4: { title: "Exportar", text: "Baixe o PDF pronto para imprimir em tamanho real." },
} as const;

function Estudio() {
  const step = useStudio((s) => s.step);
  const reset = useStudio((s) => s.reset);
  const projectName = useStudio((s) => s.projectName);
  const projectId = useStudio((s) => s.projectId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow={projectId ? `Editando: ${projectName}` : "Estúdio"}
          title={TITLES[step].title}
          description={TITLES[step].text}
        />
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => {
            if (window.confirm("Começar uma vela nova? As escolhas atuais serão apagadas.")) reset();
          }}
        >
          <RotateCcw /> <span className="hidden sm:inline">Nova vela</span>
        </Button>
      </div>
      <StudioProgress />
      {step === 1 && <StepMeasures />}
      {step === 2 && <StepArt />}
      {step === 3 && <StepAdjust />}
      {step === 4 && <StepExport />}
    </div>
  );
}
