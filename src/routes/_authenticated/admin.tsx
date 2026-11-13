import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Stúdio Velas Lucrativas" },
      { name: "description", content: "Área administrativa do Stúdio Velas Lucrativas." },
      { property: "og:title", content: "Administração — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Área administrativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Início", exact: true },
  { to: "/admin/modelos", label: "Modelos", exact: false },
  { to: "/admin/metricas", label: "Métricas", exact: false },
  { to: "/admin/usuarios", label: "Usuários", exact: false },
] as const;

function AdminLayout() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="ornament mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Admin</p>
        <nav aria-label="Administração" className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              className="focus-ring shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-gold"
              activeProps={{ className: "border-primary bg-primary text-primary-foreground hover:border-primary" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <Outlet />
      </div>
    </ProtectedRoute>
  );
}
