import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMAIL_LINK_DAYS, PACK_LICENSE, canAccessPack, emailLimitError, type Plan } from "@/lib/pack-rules";

type Ctx = { supabase: any; userId: string };

async function loadPack(ctx: Ctx, packId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [pack, profile] = await Promise.all([
    supabaseAdmin
      .from("templates")
      .select("id, title, is_premium, is_active, zip_path, template_images(id, title, original_path, sort_order, is_active)")
      .eq("id", packId)
      .maybeSingle(),
    supabaseAdmin.from("profiles").select("email, plan, marketing_consent").eq("id", ctx.userId).maybeSingle(),
  ]);
  if (pack.error || !pack.data || !pack.data.is_active) throw new Error("Pack não encontrado.");
  const plan = (profile.data?.plan as Plan | undefined) ?? "free";
  if (!canAccessPack(pack.data.is_premium, plan)) throw new Error("PREMIUM_LOCKED");
  const images = (pack.data.template_images ?? [])
    .filter((i) => i.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  return { supabaseAdmin, pack: pack.data, images, profile: profile.data };
}

async function sign(admin: any, paths: string[], seconds: number): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await admin.storage.from("pack-files").createSignedUrls(paths, seconds);
  if (error) throw new Error("Não foi possível gerar os links.");
  const out: Record<string, string> = {};
  for (const s of data ?? []) if (s.path && s.signedUrl) out[s.path] = s.signedUrl;
  return out;
}

/** Short-lived signed URLs for pack originals (and ZIP). Checks login and plan. */
export const getPackImageUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        packId: z.string().uuid(),
        imageIds: z.array(z.string().uuid()).max(50).optional(),
        log: z.enum(["download", "studio"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin, pack, images } = await loadPack(context as Ctx, data.packId);
    const chosen = data.imageIds ? images.filter((i) => data.imageIds!.includes(i.id)) : images;
    const paths = chosen.map((i) => i.original_path);
    if (pack.zip_path && !data.imageIds) paths.push(pack.zip_path);
    const urls = await sign(supabaseAdmin, paths, 10 * 60);
    if (data.log) {
      await supabaseAdmin
        .from("pack_deliveries")
        .insert({ user_id: (context as Ctx).userId, template_id: pack.id, kind: data.log, status: "ok" });
    }
    return {
      title: pack.title,
      images: chosen.map((i, n) => ({ id: i.id, title: i.title || `Estampa ${n + 1}`, path: i.original_path, url: urls[i.original_path] ?? null })),
      zipUrl: pack.zip_path && !data.imageIds ? (urls[pack.zip_path] ?? null) : null,
    };
  });

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Sends the pack by e-mail with 7-day links (Resend). Returns not_configured without faking it. */
export const sendPackEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ packId: z.string().uuid(), origin: z.string().url().max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const ctx = context as Ctx;
    const apiKey = process.env["RESEND_API_KEY"];
    const from = process.env["FROM_EMAIL"];
    if (!apiKey || !from) return { ok: false as const, reason: "not_configured" as const };

    const { supabaseAdmin, pack, images, profile } = await loadPack(ctx, data.packId);
    if (!profile?.email) return { ok: false as const, reason: "Sua conta não tem e-mail." };

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: sent } = await supabaseAdmin
      .from("pack_deliveries")
      .select("template_id, created_at")
      .eq("user_id", ctx.userId)
      .eq("kind", "email")
      .eq("status", "ok")
      .gte("created_at", since);
    const limit = emailLimitError(sent ?? [], pack.id);
    if (limit) return { ok: false as const, reason: limit };
    if (images.length === 0 && !pack.zip_path) return { ok: false as const, reason: "Este pack ainda não tem arquivos." };

    const paths = images.map((i) => i.original_path);
    if (pack.zip_path) paths.push(pack.zip_path);
    const urls = await sign(supabaseAdmin, paths, EMAIL_LINK_DAYS * 24 * 60 * 60);
    const origin = new URL(data.origin).origin;
    const packUrl = `${origin}/biblioteca/${pack.id}`;
    const items = images
      .map((i, n) => `<li><a href="${esc(urls[i.original_path] ?? packUrl)}">Estampa ${n + 1}${i.title ? ` — ${esc(i.title)}` : ""}</a></li>`)
      .join("");
    const zip = pack.zip_path && urls[pack.zip_path] ? `<p><a href="${esc(urls[pack.zip_path]!)}">Baixar o pack completo (ZIP)</a></p>` : "";
    const unsub = profile.marketing_consent
      ? `<p style="font-size:12px;color:#777">Não quer mais novidades? <a href="${origin}/cancelar-novidades">Cancelar novidades</a>.</p>`
      : "";
    const html = `<div style="font-family:Arial,sans-serif;color:#2b1a1a;max-width:560px">
<p>Olá!</p><p>Seu pack <strong>${esc(pack.title)}</strong> está pronto. Toque em cada estampa para baixar:</p>
<ul>${items}</ul>${zip}
<p><a href="${packUrl}" style="display:inline-block;background:#d4a94c;color:#2b1a1a;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Abrir no estúdio</a></p>
<p style="font-size:13px">Os links valem por ${EMAIL_LINK_DAYS} dias.</p>
<p style="font-size:13px"><strong>Licença:</strong> ${PACK_LICENSE}</p>${unsub}</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [profile.email], subject: `Seu pack ${pack.title} está pronto`, html }),
    });
    const ok = res.ok;
    if (!ok) console.error(`Resend failed [${res.status}]: ${await res.text()}`);
    await supabaseAdmin
      .from("pack_deliveries")
      .insert({ user_id: ctx.userId, template_id: pack.id, kind: "email", status: ok ? "ok" : "failed" });
    return ok ? { ok: true as const } : { ok: false as const, reason: "Não foi possível enviar o e-mail agora. Baixe direto por aqui." };
  });
