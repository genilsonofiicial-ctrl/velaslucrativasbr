import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Admin · Stúdio Velas Lucrativas" }] }),
  component: AdminUsuarios,
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

function AdminUsuarios() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, plan, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: "free" | "pro" }) => {
      const { error } = await supabase.rpc("admin_set_plan", { _user_id: id, _plan: plan });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast.success(v.plan === "pro" ? "Plano Pro liberado." : "Plano voltou para grátis.");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Não foi possível mudar o plano."),
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold text-primary">Usuários</h1>
      <p className="mt-1 text-muted-foreground">Libere o Pro manualmente depois de confirmar o pagamento.</p>
      <div className="card-soft mt-6 overflow-x-auto">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center p-10 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="mt-2 font-semibold">Não foi possível carregar os usuários.</p>
            <Button variant="outline" className="mt-3" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">E-mail</th>
                <th className="p-4 font-medium">Plano</th>
                <th className="p-4 font-medium">Cadastro</th>
                <th className="p-4 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{u.email ?? "—"}</td>
                  <td className="p-4">
                    {u.plan === "pro" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">
                        <Crown className="size-3 text-gold" /> Pro
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Grátis</span>
                    )}
                  </td>
                  <td className="p-4 text-muted-foreground">{dateFmt.format(new Date(u.created_at))}</td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant={u.plan === "pro" ? "outline" : "gold"}
                      disabled={toggle.isPending && toggle.variables?.id === u.id}
                      onClick={() => toggle.mutate({ id: u.id, plan: u.plan === "pro" ? "free" : "pro" })}
                    >
                      {toggle.isPending && toggle.variables?.id === u.id && <Loader2 className="animate-spin" />}
                      {u.plan === "pro" ? "Voltar para grátis" : "Liberar Pro"}
                    </Button>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhum usuário cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
