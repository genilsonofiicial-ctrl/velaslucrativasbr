import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Images, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const AREAS = [
  { to: "/admin/modelos", icon: Images, title: "Modelos", text: "Cadastrar, editar e desativar estampas." },
  { to: "/admin/metricas", icon: BarChart3, title: "Métricas", text: "Uso do app, exportações e opiniões." },
  { to: "/admin/usuarios", icon: Users, title: "Usuários", text: "Ver cadastros e liberar o plano Pro." },
] as const;

function AdminHome() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-primary">Painel</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {AREAS.map((a) => (
          <Link key={a.to} to={a.to} className="focus-ring card-soft block p-6 transition-shadow hover:shadow-lift">
            <a.icon className="size-6 text-gold" />
            <h2 className="mt-3 font-sans text-base font-semibold text-primary">{a.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
