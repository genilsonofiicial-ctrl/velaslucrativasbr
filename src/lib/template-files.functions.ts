import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const input = z.object({ paths: z.array(z.string().min(1).max(300)).min(1).max(200) });

/** Signed URLs only for files referenced by active templates (bucket has no public read policy). */
export const getTemplateFileUrls = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const paths = Array.from(new Set(data.paths));
    const list = paths.map((p) => `"${p.replace(/"/g, "")}"`).join(",");
    const { data: rows, error } = await supabaseAdmin
      .from("templates")
      .select("image_path, thumb_path")
      .eq("is_active", true)
      .or(`image_path.in.(${list}),thumb_path.in.(${list})`);
    if (error) throw new Error("Não foi possível carregar as imagens.");
    const allowed = new Set<string>();
    for (const r of rows ?? []) {
      if (r.image_path && paths.includes(r.image_path)) allowed.add(r.image_path);
      if (r.thumb_path && paths.includes(r.thumb_path)) allowed.add(r.thumb_path);
    }
    if (allowed.size === 0) return {} as Record<string, string>;
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("templates")
      .createSignedUrls(Array.from(allowed), 60 * 60);
    if (sErr) throw new Error("Não foi possível carregar as imagens.");
    const out: Record<string, string> = {};
    for (const s of signed ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
    return out;
  });
