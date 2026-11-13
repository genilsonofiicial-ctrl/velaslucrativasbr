import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Crown, ImageOff, Search, X } from "lucide-react";

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
import { THEMES, activeTemplatesQuery, filterTemplates, type TemplateWithUrl } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { TemplateDetailDialog } from "./TemplateDetailDialog";

const ALL = "__todas";

export function TemplateBrowser({
  onUse,
  selectedId,
}: {
  onUse: (t: TemplateWithUrl) => void;
  selectedId?: string | null | undefined;
}) {
  const { data, isLoading, isError, refetch } = useQuery(activeTemplatesQuery);
  const [theme, setTheme] = useState("");
  const [occasion, setOccasion] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<TemplateWithUrl | null>(null);

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

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar modelo (ex.: rosas, estrelas)"
            aria-label="Buscar modelo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-full pl-10"
          />
        </div>
        <Select value={occasion || ALL} onValueChange={(v) => setOccasion(v === ALL ? "" : v)}>
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
        {["", ...THEMES].map((t) => (
          <Button
            key={t || "todos"}
            size="sm"
            variant={t === theme ? "wine" : "outline"}
            onClick={() => setTheme(t)}
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
            <p className="mt-3 font-semibold text-primary">Não conseguimos carregar os modelos.</p>
            <p className="text-sm text-muted-foreground">Confira sua internet e tente de novo.</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="card-soft flex flex-col items-center p-10 text-center">
            <ImageOff className="size-10 text-gold" />
            <p className="mt-3 font-display text-xl text-primary">Nenhum modelo encontrado</p>
            <p className="text-sm text-muted-foreground">Tente outra palavra ou limpe os filtros.</p>
            {hasFilters && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setTheme("");
                  setOccasion("");
                  setSearch("");
                }}
              >
                <X /> Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "modelo" : "modelos"}
            </p>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {list.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(t)}
                    className={cn(
                      "focus-ring card-soft group block w-full overflow-hidden text-left transition-shadow hover:shadow-lift",
                      selectedId === t.id && "ring-2 ring-gold",
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-muted">
                      {t.thumbUrl ? (
                        <img
                          src={t.thumbUrl}
                          alt={`Miniatura do modelo ${t.title}`}
                          loading="lazy"
                          decoding="async"
                          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <ImageOff className="size-6" />
                        </div>
                      )}
                      {t.is_premium && (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-primary shadow-soft">
                          <Crown className="size-3 text-gold" /> Pro
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-foreground">{t.title}</p>
                      {t.theme && (
                        <span className="mt-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-primary">
                          {t.theme}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <TemplateDetailDialog
        template={open}
        onClose={() => setOpen(null)}
        onUse={(t) => {
          setOpen(null);
          onUse(t);
        }}
      />
    </div>
  );
}
