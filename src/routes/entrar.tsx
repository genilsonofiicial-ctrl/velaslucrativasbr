import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { safeRedirect } from "@/lib/safe-redirect";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Stúdio Velas Lucrativas" },
      { name: "description", content: "Entre para salvar suas velas e ver o seu plano." },
      { property: "og:title", content: "Entrar — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Entre para salvar suas velas e ver o seu plano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Entrar,
});

function Entrar() {
  const { redirect } = Route.useSearch();
  const destino = safeRedirect(redirect);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate({ to: destino, replace: true });
  }, [user, destino, navigate]);

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <div className="text-center">
        <p className="ornament text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Bem-vinda
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-primary">Entrar</h1>
        <p className="mt-2 text-muted-foreground">
          Só precisa entrar para salvar suas velas e ver seu plano.
        </p>
      </div>

      <div className="card-soft mt-8 p-6">
        <Tabs defaultValue="link">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted p-1">
            <TabsTrigger value="link" className="rounded-full">
              <Mail className="size-4" /> Link por e-mail
            </TabsTrigger>
            <TabsTrigger value="senha" className="rounded-full">
              <KeyRound className="size-4" /> Senha
            </TabsTrigger>
          </TabsList>
          <TabsContent value="link" className="mt-6">
            <MagicLinkForm destino={destino} />
          </TabsContent>
          <TabsContent value="senha" className="mt-6">
            <PasswordForm destino={destino} />
          </TabsContent>
        </Tabs>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Quer só testar?{" "}
        <Link to="/estudio" className="font-semibold text-primary underline underline-offset-4">
          Use o estúdio sem login
        </Link>
      </p>
    </div>
  );
}

function MagicLinkForm({ destino }: { destino: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + destino },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o link. Confira o e-mail e tente de novo.");
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="py-4 text-center">
        <MailCheck className="mx-auto size-10 text-gold" />
        <p className="mt-3 font-semibold text-primary">Pronto! Veja seu e-mail.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviamos um link para <strong>{email}</strong>. Clique nele para entrar.
        </p>
        <Button variant="link" className="mt-2" onClick={() => setEnviado(false)}>
          Usar outro e-mail
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Seu e-mail</Label>
        <Input
          id="magic-email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} Receber link para entrar
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Sem senha: você entra clicando no link que chega no e-mail.
      </p>
    </form>
  );
}

function PasswordForm({ destino }: { destino: string }) {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      setLoading(false);
      if (error) toast.error("E-mail ou senha incorretos.");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { emailRedirectTo: window.location.origin + destino },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.toLowerCase().includes("password")
          ? "Use uma senha com pelo menos 6 caracteres."
          : "Não foi possível criar a conta. Tente de novo.",
      );
      return;
    }
    if (!data.session) setConfirmar(true);
  }

  if (confirmar) {
    return (
      <div className="py-4 text-center">
        <MailCheck className="mx-auto size-10 text-gold" />
        <p className="mt-3 font-semibold text-primary">Confirme seu e-mail</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviamos um link para <strong>{email}</strong>. Depois de confirmar, é só entrar.
        </p>
        <Button
          variant="link"
          className="mt-2"
          onClick={() => {
            setConfirmar(false);
            setModo("entrar");
          }}
        >
          Voltar para entrar
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pw-email">E-mail</Label>
        <Input
          id="pw-email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pw-senha">Senha</Label>
        <Input
          id="pw-senha"
          type="password"
          required
          minLength={6}
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="h-11 rounded-xl"
        />
      </div>
      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />}
        {modo === "entrar" ? "Entrar" : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {modo === "entrar" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
        <button
          type="button"
          className="font-semibold text-primary underline underline-offset-4"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
        >
          {modo === "entrar" ? "Criar agora" : "Entrar"}
        </button>
      </p>
      {modo === "entrar" && (
        <p className="text-center text-xs text-muted-foreground">
          Esqueceu a senha? Use a aba “Link por e-mail”.
        </p>
      )}
    </form>
  );
}
