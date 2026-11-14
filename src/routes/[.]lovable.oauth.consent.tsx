import { useState } from "react";
import { createFileRoute, redirect, type ErrorComponentProps } from "@tanstack/react-router";
import { Check, Loader2, PlugZap, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  approveAuthorization,
  denyAuthorization,
  getAuthorizationDetails,
} from "@/lib/supabase-oauth";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  // A sessão fica no navegador; uma checagem no servidor desviaria até quem já entrou.
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    authorization_id: typeof search["authorization_id"] === "string" ? search["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Pedido de conexão incompleto.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/entrar", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.searchStr).get("authorization_id");
    if (!authorizationId) throw new Error("Pedido de conexão incompleto.");
    const { data, error } = await getAuthorizationDetails(authorizationId);
    if (error || !data) throw new Error("Este pedido de conexão é inválido ou expirou.");
    const immediate = data.redirect_url ?? data.redirect_to;
    if (immediate && !data.client) throw redirect({ href: immediate });
    return data;
  },
  head: () => ({
    meta: [
      { title: "Conectar assistente — Stúdio Velas Lucrativas" },
      { name: "description", content: "Autorize um assistente a usar o Stúdio Velas Lucrativas com a sua conta." },
      { property: "og:title", content: "Conectar assistente — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Revise e autorize a conexão com um assistente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Consent,
  pendingComponent: () => (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-label="Carregando conexão" />
    </div>
  ),
  errorComponent: ConsentError,
});

function ConsentError(_props: ErrorComponentProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <PlugZap className="mx-auto size-10 text-gold" />
      <h1 className="mt-4 text-2xl font-semibold text-primary">Não foi possível abrir esta conexão</h1>
      <p className="mt-2 text-muted-foreground">
        O pedido pode ter expirado. Volte ao assistente e comece a conexão novamente.
      </p>
    </div>
  );
}

const SCOPE_LABELS: Record<string, string> = {
  openid: "Confirmar sua identidade",
  email: "Compartilhar seu endereço de e-mail",
  profile: "Compartilhar seu perfil básico",
};

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id: authorizationId } = Route.useSearch();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details.client?.name ?? "este assistente";
  const redirectUri = details.client?.redirect_uri ?? details.client?.redirect_uris?.[0];
  const scopes = (details.scope ?? "openid email profile").split(/\s+/).filter(Boolean);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: failure } = approve
      ? await approveAuthorization(authorizationId)
      : await denyAuthorization(authorizationId);
    if (failure) {
      setBusy(false);
      setError("Não foi possível concluir a escolha. Tente novamente.");
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("O assistente não informou para onde voltar. Comece a conexão novamente.");
      return;
    }
    window.location.href = target;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-14">
      <div className="card-soft p-6 md:p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <PlugZap className="size-6" />
        </div>
        <p className="ornament mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Conexão com assistente
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-primary md:text-3xl">
          Conectar {clientName} ao Stúdio Velas Lucrativas
        </h1>
        <p className="mt-3 text-muted-foreground">
          Isso permite que {clientName} use as ferramentas liberadas do app como você.
        </p>

        <dl className="mt-6 space-y-3 rounded-2xl bg-muted p-4 text-sm">
          <div>
            <dt className="font-semibold text-foreground">Conta conectada</dt>
            <dd className="mt-0.5 text-muted-foreground">{user?.email ?? "Sua conta"}</dd>
          </div>
          {redirectUri && (
            <div>
              <dt className="font-semibold text-foreground">Retorno do assistente</dt>
              <dd className="mt-0.5 break-all text-muted-foreground">{redirectUri}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <h2 className="font-semibold text-primary">O que será compartilhado</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {scopes.map((scope) => (
              <li key={scope} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                {SCOPE_LABELS[scope] ?? `Permissão adicional: ${scope}`}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-primary">Ferramentas disponíveis</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Calcular as medidas reais de uma arte para vela.</li>
            <li>• Consultar os modelos ativos da biblioteca.</li>
            <li>• Listar e abrir somente os projetos salvos na sua conta.</li>
          </ul>
        </div>

        <p className="mt-6 flex gap-2 rounded-2xl bg-accent p-4 text-sm text-primary">
          <ShieldCheck className="mt-0.5 size-5 shrink-0" />
          Esta conexão não ultrapassa as permissões do app nem libera projetos de outras contas.
        </p>

        {error && <p role="alert" className="mt-4 rounded-xl bg-destructive-soft p-3 text-sm text-destructive">{error}</p>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="lg" disabled={busy} onClick={() => void decide(false)}>
            <X /> Cancelar conexão
          </Button>
          <Button variant="gold" size="lg" disabled={busy} onClick={() => void decide(true)}>
            {busy ? <Loader2 className="animate-spin" /> : <Check />} Autorizar conexão
          </Button>
        </div>
      </div>
    </div>
  );
}
