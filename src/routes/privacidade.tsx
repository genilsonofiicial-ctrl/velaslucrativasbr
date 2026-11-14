import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Stúdio Velas Lucrativas" },
      { name: "description", content: "Como usamos seu e-mail e seus dados." },
      { property: "og:title", content: "Política de Privacidade — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Como usamos seu e-mail e seus dados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-2xl space-y-3 px-4 py-10">
      <h1 className="text-3xl font-semibold text-primary">Política de Privacidade</h1>
      <p>Usamos seu e-mail para entrar no app e enviar os packs que você pedir.</p>
      <p>Só enviamos novidades se você marcar essa opção, e você pode cancelar quando quiser.</p>
      <p>Não vendemos nem compartilhamos seu e-mail.</p>
    </div>
  ),
});
