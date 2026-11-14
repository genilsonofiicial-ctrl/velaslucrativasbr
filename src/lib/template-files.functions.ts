import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({ paths: z.array(z.string().min(1).max(300)).min(1).max(400) });

/**
 * Signed URLs for public-facing template files (covers and thumbnails of active packs,
 * plus legacy images of active templates). The bucket itself has no public read policy.
 */
export const getTemplateFileUrls = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const paths = Array.from(new Set(data.paths));
    const wanted = new Set(paths);
    const [tpl, imgs] = await Promise.all([
      supabaseAdmin.from("templates").select("image_path, thumb_path, cover_path").eq("is_active", true),
      supabaseAdmin
        .from("template_images")
        .select("thumb_path, templates!inner(is_active)")
        .eq("is_active", true)
        .eq("templates.is_active", true)
        .in("thumb_path", paths),
    ]);
    if (tpl.error || imgs.error) throw new Error("Não foi possível carregar as imagens.");
    const allowed = new Set<string>();
    for (const r of tpl.data ?? []) {
      for (const p of [r.image_path, r.thumb_path, r.cover_path]) if (p && wanted.has(p)) allowed.add(p);
    }
    for (const r of imgs.data ?? []) if (r.thumb_path && wanted.has(r.thumb_path)) allowed.add(r.thumb_path);
    if (allowed.size === 0) return {} as Record<string, string>;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("templates")
      .createSignedUrls(Array.from(allowed), 60 * 60);
    if (error) throw new Error("Não foi possível carregar as imagens.");
    const out: Record<string, string> = {};
    for (const s of signed ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
    return out;
  });
