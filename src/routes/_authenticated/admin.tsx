import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Images, MessageSquareHeart } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Stúdio Velas Lucrativas" },
      { name: "description", content: "Área administrativa." },
      { property: "og:title", content: "Administração — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Área administrativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute requireAdmin>
      <Admin />
    </ProtectedRoute>
  ),
});

const AREAS = [
  { icon: Images, title: "Modelos", text: "Cadastrar e organizar estampas." },
  { icon: BarChart3, title: "Uso do app", text: "Ver métricas de uso." },
  { icon: MessageSquareHeart, title: "Opiniões", text: "Ler o que as usuárias dizem." },
];

function Admin() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="Admin" title="Área administrativa" description="Em construção." />
      <div className="grid gap-4 md:grid-cols-3">
        {AREAS.map((a) => (
          <div key={a.title} className="card-soft p-6">
            <a.icon className="size-6 text-gold" />
            <h2 className="mt-3 font-sans text-base font-semibold text-primary">{a.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
