import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const THEMES = [
  "Natal",
  "Religioso",
  "Casamento",
  "Bebê",
  "Aniversário e festa",
  "Datas especiais",
  "Geométrico e liso",
] as const;

export type TemplateRow = Tables<"templates">;
export type TemplateWithUrl = TemplateRow & { thumbUrl: string | null };

async function withSignedUrls(rows: TemplateRow[]): Promise<TemplateWithUrl[]> {
  const paths = Array.from(
    new Set(rows.map((r) => r.thumb_path || r.image_path).filter((p): p is string => !!p)),
  );
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data, error } = await supabase.storage.from("templates").createSignedUrls(paths, 60 * 60);
    if (error) throw new Error("Não foi possível carregar as imagens dos modelos.");
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }
  return rows.map((r) => ({ ...r, thumbUrl: urls.get(r.thumb_path || r.image_path || "") ?? null }));
}

export async function fetchActiveTemplates(): Promise<TemplateWithUrl[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("is_premium", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os modelos. Tente de novo.");
  return withSignedUrls(data ?? []);
}

export async function fetchAllTemplates(): Promise<TemplateWithUrl[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os modelos.");
  return withSignedUrls(data ?? []);
}

export const activeTemplatesQuery = queryOptions({
  queryKey: ["templates", "active"],
  queryFn: fetchActiveTemplates,
  staleTime: 30 * 60 * 1000,
});

export const allTemplatesQuery = queryOptions({
  queryKey: ["templates", "all"],
  queryFn: fetchAllTemplates,
});

export interface TemplateFilters {
  theme: string;
  occasion: string;
  search: string;
}

/** Filtra por tema, ocasião e texto (título, tema, ocasião e etiquetas), sem diferenciar acentos. */
export function filterTemplates<T extends Pick<TemplateRow, "title" | "theme" | "occasion" | "tags">>(
  list: T[],
  f: TemplateFilters,
): T[] {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const q = norm(f.search.trim());
  return list.filter((t) => {
    if (f.theme && t.theme !== f.theme) return false;
    if (f.occasion && t.occasion !== f.occasion) return false;
    if (!q) return true;
    const hay = norm([t.title, t.theme ?? "", t.occasion ?? "", ...(t.tags ?? [])].join(" "));
    return hay.includes(q);
  });
}
