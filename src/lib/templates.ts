import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getTemplateFileUrls } from "@/lib/template-files.functions";

export const THEMES = [
  "Natal",
  "Religioso",
  "Casamento",
  "Bebê",
  "Aniversário e festa",
  "Dia das Mães",
  "Dia dos Namorados",
  "Páscoa",
  "Floral",
  "Geométrico e liso",
] as const;

export type TemplateRow = Tables<"templates">;
export type PackImageRow = Tables<"template_images">;
export type PackImage = PackImageRow & { thumbUrl: string | null };
export type Pack = TemplateRow & { coverUrl: string | null; thumbUrl: string | null; images: PackImage[] };
/** @deprecated nome antigo; um modelo agora é um pack. */
export type TemplateWithUrl = Pack;

/** Pack está pronto para uso quando tem capa e pelo menos uma estampa ativa. */
export function isPackReady(p: Pick<Pack, "cover_path" | "images">): boolean {
  return !!p.cover_path && p.images.some((i) => i.is_active);
}

async function withUrls(rows: (TemplateRow & { template_images: PackImageRow[] | null })[], admin: boolean): Promise<Pack[]> {
  const paths = new Set<string>();
  for (const r of rows) {
    if (r.cover_path) paths.add(r.cover_path);
    for (const i of r.template_images ?? []) if (i.thumb_path) paths.add(i.thumb_path);
  }
  const urls = new Map<string, string>();
  const list = Array.from(paths);
  if (list.length > 0) {
    if (admin) {
      const { data, error } = await supabase.storage.from("templates").createSignedUrls(list, 60 * 60);
      if (error) throw new Error("Não foi possível carregar as imagens.");
      for (const s of data ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    } else {
      const signed = await getTemplateFileUrls({ data: { paths: list } });
      for (const [k, v] of Object.entries(signed)) urls.set(k, v);
    }
  }
  return rows.map(({ template_images, ...r }) => {
    const images = (template_images ?? [])
      .filter((i) => admin || i.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({ ...i, thumbUrl: i.thumb_path ? (urls.get(i.thumb_path) ?? null) : null }));
    const coverUrl = r.cover_path ? (urls.get(r.cover_path) ?? null) : null;
    return { ...r, images, coverUrl, thumbUrl: coverUrl };
  });
}

export async function fetchActiveTemplates(): Promise<Pack[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*, template_images(*)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os packs. Tente de novo.");
  return withUrls(data ?? [], false);
}

export async function fetchAllTemplates(): Promise<Pack[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*, template_images(*)")
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os packs.");
  return withUrls(data ?? [], true);
}

export const activeTemplatesQuery = queryOptions({
  queryKey: ["templates", "active"],
  queryFn: fetchActiveTemplates,
  staleTime: 60 * 1000,
  refetchInterval: 60 * 1000,
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
