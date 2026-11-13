import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/metricas")({
  head: () => ({ meta: [{ title: "Métricas — Admin · Stúdio Velas Lucrativas" }] }),
  component: AdminMetricas,
});

interface Metrics {
  visitors: number;
  calcs: number;
  exports: number;
  users: number;
  returning: number;
  exports_by_day: { day: string; count: number }[];
  pay: { answer: string; count: number }[];
  helped: { answer: string; count: number }[];
  comments: { comment: string; created_at: string; pay: string | null }[];
  top_templates: { id: string; title: string | null; theme: string | null; selected: number; exported: number }[];
}

const PAY_ORDER = ["Nada", "Até R$ 10", "R$ 10 a R$ 20", "R$ 20 a R$ 40", "Mais de R$ 40"];
const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function AdminMetricas() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_metrics");
      if (error) throw error;
      return data as unknown as Metrics;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="card-soft flex flex-col items-center p-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="mt-2 font-semibold">Não foi possível carregar as métricas.</p>
        <Button variant="outline" className="mt-3" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  const rate = data.visitors > 0 ? (data.exports / data.visitors) * 100 : 0;
  const maxDay = Math.max(1, ...data.exports_by_day.map((d) => d.count));
  const payTotal = data.pay.reduce((s, p) => s + p.count, 0);
  const pay = PAY_ORDER.map((a) => ({ answer: a, count: data.pay.find((p) => p.answer === a)?.count ?? 0 }));

  const cards = [
    { label: "Visitantes únicos", value: data.visitors },
    { label: "Cálculos concluídos", value: data.calcs },
    { label: "Exportações (PDF + PNG)", value: data.exports },
    { label: "Taxa de exportação", value: `${rate.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` },
    { label: "Usuários cadastrados", value: data.users },
    { label: "Voltaram em outro dia", value: data.returning },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-primary">Métricas</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card-soft p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold text-primary">
              {typeof c.value === "number" ? c.value.toLocaleString("pt-BR") : c.value}
            </p>
          </div>
        ))}
      </div>

      <section className="card-soft p-5">
        <h2 className="font-sans text-base font-semibold text-primary">Exportações por dia (30 dias)</h2>
        <div className="mt-4 flex h-40 items-end gap-1" role="img" aria-label="Gráfico de exportações por dia">
          {data.exports_by_day.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className="min-h-0.5 rounded-t bg-gradient-gold"
                style={{ height: `${(d.count / maxDay) * 100}%` }}
                title={`${dayFmt.format(new Date(d.day))}: ${d.count}`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{data.exports_by_day[0] ? dayFmt.format(new Date(data.exports_by_day[0].day)) : ""}</span>
          <span>hoje</span>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card-soft p-5">
          <h2 className="font-sans text-base font-semibold text-primary">Quanto pagaria por mês</h2>
          <ul className="mt-4 space-y-3">
            {pay.map((p) => (
              <li key={p.answer}>
                <div className="flex justify-between text-sm">
                  <span>{p.answer}</span>
                  <span className="font-semibold">{p.count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${payTotal ? (p.count / payTotal) * 100 : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {data.helped.length > 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              Ajudou: {data.helped.map((h) => `${h.answer} (${h.count})`).join(" · ")}
            </p>
          )}
        </section>

        <section className="card-soft p-5">
          <h2 className="font-sans text-base font-semibold text-primary">Últimos comentários</h2>
          {data.comments.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum comentário ainda.</p>
          ) : (
            <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto">
              {data.comments.map((c, i) => (
                <li key={i} className="rounded-xl bg-muted p-3 text-sm">
                  <p>{c.comment}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dateFmt.format(new Date(c.created_at))}
                    {c.pay && ` · pagaria: ${c.pay}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card-soft overflow-x-auto p-5">
        <h2 className="font-sans text-base font-semibold text-primary">Modelos mais usados</h2>
        {data.top_templates.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Ainda sem dados.</p>
        ) : (
          <table className="mt-4 w-full min-w-[420px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="pb-2 font-medium">Modelo</th>
                <th className="pb-2 font-medium">Tema</th>
                <th className="pb-2 text-right font-medium">Escolhido</th>
                <th className="pb-2 text-right font-medium">Exportado</th>
              </tr>
            </thead>
            <tbody>
              {data.top_templates.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="py-2 font-medium">{t.title ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">{t.theme ?? "—"}</td>
                  <td className="py-2 text-right">{t.selected}</td>
                  <td className="py-2 text-right">{t.exported}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
