import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ImageOff, Lock, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { THEMES, activeTemplatesQuery, filterTemplates, isPackReady, type TemplateFilters } from "@/lib/templates";
import { ComingSoon } from "./ComingSoon";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";
import { cn } from "@/lib/utils";
import { useWebMCP } from "use-webmcp-tool";

const ALL = "__todas";

export function TemplateBrowser({ selectedId }: { selectedId?: string | null | undefined }) {
  const { data, isLoading, isError, refetch } = useQuery(activeTemplatesQuery);
  const [theme, setTheme] = useState("");
  const [occasion, setOccasion] = useState("");
  const [search, setSearch] = useState("");
  const themes = useMemo(() => Array.from(new Set((data ?? []).map((t) => t.theme).filter((t): t is string => !!t))).sort((a, b) => a.localeCompare(b, "pt-BR")), [data]);

  const occasions = useMemo(
    () =>
      Array.from(new Set((data ?? []).map((t) => t.occasion).filter((o): o is string => !!o))).sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [data],
  );
  const list = useMemo(
    () => filterTemplates(data ?? [], { theme, occasion, search }),
    [data, theme, occasion, search],
  );
  const hasFilters = !!(theme || occasion || search);

  function changeFilters(patch: Partial<TemplateFilters>) {
    if (patch.theme !== undefined) setTheme(patch.theme);
    if (patch.occasion !== undefined) setOccasion(patch.occasion);
    if (patch.search !== undefined) setSearch(patch.search);
  }

  useWebMCP({
    name: "list_visible_templates",
    description: "Lista os modelos atualmente visíveis na biblioteca, respeitando os filtros ativos.",
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    enabled: !isLoading && !isError,
    execute: () => runWebMCPTool("list_visible_templates", () =>
      list.length === 0
        ? "Nenhum modelo visível com os filtros atuais."
        : list.map((t) => `${t.id}: ${t.title} — ${t.theme ?? "sem tema"}${t.is_premium ? " — Premium" : ""} — ${t.images.length} estampa(s)`).join("\n"),
    ),
  });

  useWebMCP({
    name: "filter_templates",
    description: "Altera os filtros visíveis da biblioteca por tema, ocasião e texto de busca.",
    annotations: { untrustedContentHint: true },
    enabled: !isLoading && !isError,
    inputSchema: {
      type: "object",
      properties: {
        theme: { type: "string", description: "Tema exato ou texto vazio para todos." },
        occasion: { type: "string", description: "Ocasião exata disponível ou texto vazio para todas." },
        search: { type: "string", description: "Texto livre buscado em título, tema, ocasião e etiquetas." },
      },
    },
    execute: (args: { theme?: string; occasion?: string; search?: string }) => runWebMCPTool("filter_templates", () => {
      if (args.theme !== undefined && (typeof args.theme !== "string" || (args.theme !== "" && !themes.includes(args.theme)))) {
        throw new Error("Tema desconhecido; use um tema da biblioteca ou texto vazio.");
      }
      if (args.occasion !== undefined && (typeof args.occasion !== "string" || (args.occasion !== "" && !occasions.includes(args.occasion)))) {
        throw new Error("Ocasião desconhecida; use uma ocasião da biblioteca ou texto vazio.");
      }
      if (args.search !== undefined && typeof args.search !== "string") {
        throw new Error("A busca deve ser um texto.");
      }
      const next = {
        theme: args.theme ?? theme,
        occasion: args.occasion ?? occasion,
        search: args.search ?? search,
      };
      const count = filterTemplates(data ?? [], next).length;
      changeFilters(args);
      return `Filtros atualizados; ${count} modelo(s) visível(is).`;
    }),
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar pack (ex.: rosas, estrelas)"
            aria-label="Buscar pack"
            value={search}
            onChange={(e) => changeFilters({ search: e.target.value })}
            className="h-11 rounded-full pl-10"
          />
        </div>
        <Select value={occasion || ALL} onValueChange={(v) => changeFilters({ occasion: v === ALL ? "" : v })}>
          <SelectTrigger className="h-11 rounded-full sm:w-56" aria-label="Ocasião">
            <SelectValue placeholder="Ocasião" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as ocasiões</SelectItem>
            {occasions.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Tema">
        {["", ...themes].map((t) => (
          <Button
            key={t || "todos"}
            size="sm"
            variant={t === theme ? "wine" : "outline"}
            onClick={() => changeFilters({ theme: t })}
            className="shrink-0"
            aria-pressed={t === theme}
          >
            {t || "Todos"}
          </Button>
        ))}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-soft overflow-hidden">
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card-soft flex flex-col items-center p-10 text-center">
            <AlertCircle className="size-10 text-destructive" />
            <p className="mt-3 font-semibold text-primary">Não conseguimos carregar os packs.</p>
            <p className="text-sm text-muted-foreground">Confira sua internet e tente de novo.</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="card-soft flex flex-col items-center p-10 text-center">
            <ImageOff className="size-10 text-gold" />
            <p className="mt-3 font-display text-xl text-primary">Nenhum pack encontrado</p>
            <p className="text-sm text-muted-foreground">Tente outra palavra ou limpe os filtros.</p>
            {hasFilters && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => changeFilters({ theme: "", occasion: "", search: "" })}
              >
                <X /> Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "pack" : "packs"}
            </p>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {list.map((t) => (
                <li key={t.id}>
                  <Link
                    to="/biblioteca/$id"
                    params={{ id: t.id }}
                    className={cn(
                      "focus-ring card-soft group block w-full overflow-hidden text-left transition-shadow hover:shadow-lift",
                      selectedId === t.id && "ring-2 ring-gold",
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {t.coverUrl ? (
                        <img
                          src={t.coverUrl}
                          alt={`Capa do pack ${t.title}`}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <ComingSoon />
                      )}
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-primary shadow-soft">
                        {t.is_premium ? (
                          <>
                            <Lock className="size-3 text-gold" /> Premium
                          </>
                        ) : (
                          "Grátis"
                        )}
                      </span>
                      {!isPackReady(t) && (
                        <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-foreground">
                          Em breve
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">{t.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        {t.theme && (
                          <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-primary">{t.theme}</span>
                        )}
                        {t.images.length} {t.images.length === 1 ? "estampa" : "estampas"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

    </div>
  );
}
