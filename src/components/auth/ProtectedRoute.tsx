import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hides content until the visitor is signed in (and, with requireAdmin, is an admin).
 * This only controls what is shown — the database rules are what actually protect the data.
 */
export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, loading, isAdmin, plan } = useAuth();
  const location = useLocation();

  // plan === null while the role check is still loading for a signed-in user.
  if (loading || (user && requireAdmin && plan === null)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-label="Carregando" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/entrar" search={{ redirect: location.href }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-primary">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-primary">Área restrita</h1>
        <p className="mt-2 text-muted-foreground">Esta página é só para administradores.</p>
        <Button asChild variant="gold" className="mt-6">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
