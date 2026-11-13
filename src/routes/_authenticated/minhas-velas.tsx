import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Flame, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/minhas-velas")({
  head: () => ({
    meta: [
      { title: "Minhas velas — Stúdio Velas Lucrativas" },
      { name: "description", content: "Seus projetos de vela salvos." },
      { property: "og:title", content: "Minhas velas — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Seus projetos de vela salvos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <MinhasVelas />
    </ProtectedRoute>
  ),
});

function MinhasVelas() {
  const { user, plan } = useAuth();
  const { data: projetos, isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, candle_diameter_cm, candle_height_cm, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader eyebrow="Minhas velas" title="Seus projetos" description={user?.email ?? undefined}>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-accent px-4 py-1.5 text-sm">
          <Crown className="size-4 text-gold" />
          Plano: <strong className="text-primary">{plan === "pro" ? "Pro" : "Grátis"}</strong>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : projetos && projetos.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((p) => (
            <li key={p.id} className="card-soft p-5">
              <h2 className="font-sans text-base font-semibold text-primary">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.candle_diameter_cm ?? "–"} × {p.candle_height_cm ?? "–"} cm
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card-soft p-10 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-primary">
            <Flame className="size-7" />
          </div>
          <p className="mt-4 font-display text-xl text-primary">Nenhuma vela salva ainda</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie no estúdio e salve aqui para usar depois.
          </p>
          <Button asChild variant="gold" className="mt-6">
            <Link to="/estudio">
              <Plus /> Criar minha primeira vela
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
