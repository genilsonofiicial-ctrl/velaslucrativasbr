import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Flame } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { useStudio } from "@/stores/studio";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BottomNav } from "@/components/layout/BottomNav";

function NotFoundComponent() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-soft">
        <Flame className="size-8" />
      </div>
      <p className="mt-6 font-display text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-2 text-xl font-semibold text-foreground">Essa página apagou…</h1>
      <p className="mt-2 text-muted-foreground">
        Não encontramos o que você procurava. Que tal voltar e acender uma nova ideia?
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild variant="gold">
          <Link to="/">Voltar ao início</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/estudio">Abrir o estúdio</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-primary">Esta página não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente de novo ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            variant="gold"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Tentar de novo
          </Button>
          <Button asChild variant="outline">
            <a href="/">Voltar ao início</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Never add og:image or twitter:image here: every page would inherit it.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#4e0d1a" },
      { title: "Stúdio Velas Lucrativas" },
      {
        name: "description",
        content: "Crie estampas para velas em papel de seda, com medidas certas e prontas para imprimir.",
      },
      { name: "author", content: "Stúdio Velas Lucrativas" },
      { property: "og:title", content: "Stúdio Velas Lucrativas" },
      {
        property: "og:description",
        content: "Crie estampas para velas em papel de seda, com medidas certas e prontas para imprimir.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Restaura o trabalho do estúdio salvo neste navegador (depois da hidratação).
  useEffect(() => {
    void useStudio.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex min-h-screen flex-col pb-safe-nav md:pb-0">
          <SiteHeader />
          <main className="flex-1">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <BottomNav />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
