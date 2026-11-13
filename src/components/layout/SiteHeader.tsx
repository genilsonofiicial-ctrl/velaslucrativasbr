import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "./nav-items";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-gradient-wine shadow-lift">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-wine-foreground/80 transition-colors hover:bg-wine-foreground/10 hover:text-wine-foreground"
              activeProps={{ className: "bg-wine-foreground/10 text-gold-light" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              className="focus-ring rounded-full p-2.5 text-wine-foreground/80 hover:text-gold-light"
              aria-label="Área administrativa"
            >
              <Shield className="size-5" />
            </Link>
          )}
          {user ? (
            <Button variant="gold" size="sm" onClick={signOut}>
              <LogOut /> Sair
            </Button>
          ) : (
            <Button asChild variant="gold" size="sm">
              <Link to="/entrar">
                <LogIn /> Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
