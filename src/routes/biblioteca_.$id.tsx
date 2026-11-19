import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2, Lock, Mail, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ComingSoon } from "@/components/library/ComingSoon";
import { FavoriteButton } from "@/components/library/FavoriteButton";
import { PackSignupDialog } from "@/components/library/PackSignupDialog";
import { UNLOCK_URL } from "@/config";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { downloadPackZip, openUnlock, takePendingAction, type PackAction } from "@/lib/pack-actions";
import { PACK_LICENSE } from "@/lib/pack-rules";
import { getPackImageUrls, sendPackEmail } from "@/lib/packs.functions";
import { activeTemplatesQuery, isPackReady, type Pack } from "@/lib/templates";
import { useStudio } from "@/stores/studio";

export const Route = createFileRoute("/biblioteca_/$id")({
  head: () => ({
    meta: [
      { title: "Pack de estampas — Stúdio Velas Lucrativas" },
      { name: "description", content: "Veja as estampas do pack, baixe ou use direto no estúdio." },
      { property: "og:title", content: "Pack de estampas — Stúdio Velas Lucrativas" },
      { property: "og:description", content: "Veja as estampas do pack, baixe ou use direto no estúdio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PackPage,
});

const NOT_CONFIGURED = "O envio por e-mail ainda não está configurado. Baixe direto por aqui.";

function errMsg(e: unknown) {
  const m = e instanceof Error ? e.message : "";
  if (m.includes("PREMIUM")) return "Este pack é premium. Desbloqueie para usar.";
  if (m.includes("Unauthorized")) return "Entre com seu e-mail para continuar.";
  return m || "Algo deu errado. Tente de novo.";
}

function PackPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(activeTemplatesQuery);
  const pack = data?.find((p) => p.id === id);
  const { user, plan } = useAuth();
  const selectTemplate = useStudio((s) => s.selectTemplate);
  const setStep = useStudio((s) => s.setStep);
  const [ask, setAsk] = useState<PackAction | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const viewed = useRef(false);

  useEffect(() => {
    if (pack && !viewed.current) {
      viewed.current = true;
      void track("pack_viewed", { template_id: pack.id, title: pack.title });
    }
  }, [pack]);

  async function perform(p: Pack, a: PackAction) {
    const key = a.type + (a.imageId ?? "");
    setBusy(key);
    try {
      if (a.type === "email") {
        const r = await sendPackEmail({ data: { packId: p.id, origin: window.location.origin } });
        if (r.ok) {
          toast.success("Pronto! Confira seu e-mail (veja também a caixa de spam).");
          void track("pack_email_sent", { template_id: p.id });
        } else if (r.reason === "not_configured") toast.info(NOT_CONFIGURED);
        else toast.error(r.reason);
      } else if (a.type === "download") {
        const r = await getPackImageUrls({ data: { packId: p.id, log: "download" } });
        if (r.zipUrl) {
          const link = document.createElement("a");
          link.href = r.zipUrl;
          link.download = "";
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
          await downloadPackZip(p.title, r.images);
        }
        void track("pack_downloaded", { template_id: p.id });
      } else if (a.imageId) {
        const r = await getPackImageUrls({ data: { packId: p.id, imageIds: [a.imageId], log: "studio" } });
        const img = p.images.find((i) => i.id === a.imageId);
        if (!img || !r.images[0]?.url) throw new Error("Estampa indisponível.");
        const n = p.images.indexOf(img) + 1;
        selectTemplate({
          id: p.id,
          title: `${p.title} — ${img.title || `Estampa ${n}`}`,
          theme: p.theme,
          imagePath: img.original_path,
          isPremium: p.is_premium,
          packId: p.id,
          imageId: img.id,
        });
        void track("pack_image_to_studio", { template_id: p.id, image_id: img.id });
        setStep(3);
        toast.success("Estampa no estúdio. Suas medidas foram mantidas.");
        navigate({ to: "/estudio" });
      }
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  function run(a: PackAction) {
    if (!pack) return;
    if (!user) setAsk(a);
    else void perform(pack, a);
  }

  // Volta do link mágico: continua a ação pedida antes do cadastro.
  useEffect(() => {
    if (!user || !pack || plan === null) return;
    const p = takePendingAction(pack.id);
    if (!p) return;
    void track("pack_signup_completed", { template_id: pack.id });
    if (p.marketing) {
      void supabase
        .from("profiles")
        .update({ marketing_consent: true, marketing_consent_at: new Date().toISOString() })
        .eq("id", user.id);
    }
    void perform(pack, p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pack, plan]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="aspect-[16/9] rounded-3xl" />
      </div>
    );
  }
  if (!pack) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-display text-2xl text-primary">Pack não encontrado</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/biblioteca">Voltar à biblioteca</Link>
        </Button>
      </div>
    );
  }

  const ready = isPackReady(pack);
  const locked = pack.is_premium && plan !== "pro";
  const unlock = () => {
    void track("unlock_clicked", { template_id: pack.id });
    openUnlock(pack.purchase_url || UNLOCK_URL);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <Link to="/biblioteca" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-4" /> Biblioteca
      </Link>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="card-soft aspect-[4/3] overflow-hidden">
          {pack.coverUrl ? (
            <img src={pack.coverUrl} alt={`Capa do pack ${pack.title}`} className="size-full object-cover" />
          ) : (
            <ComingSoon />
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            {pack.theme} · {pack.is_premium ? "Premium" : "Grátis"} · {pack.images.length}{" "}
            {pack.images.length === 1 ? "estampa" : "estampas"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-primary">{pack.title}</h1>
          {pack.description && <p className="mt-2 text-muted-foreground">{pack.description}</p>}
          {!ready && <p className="mt-3 rounded-xl bg-accent p-3 text-sm text-primary">Em breve: este pack ainda está sendo preparado.</p>}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {locked ? (
              <Button variant="gold" onClick={unlock}>
                <Lock /> Desbloquear packs premium
              </Button>
            ) : (
              <>
                <Button variant="gold" disabled={!ready || !!busy} onClick={() => run({ type: "email", packId: pack.id })}>
                  {busy === "email" ? <Loader2 className="animate-spin" /> : <Mail />} Receber o pack por e-mail
                </Button>
                <Button variant="outline" disabled={!ready || !!busy} onClick={() => run({ type: "download", packId: pack.id })}>
                  {busy === "download" ? <Loader2 className="animate-spin" /> : <Download />} Baixar agora
                </Button>
              </>
            )}
          </div>
          <p className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">Licença:</strong> {PACK_LICENSE}
          </p>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-primary">Estampas</h2>
      {pack.images.length === 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-soft aspect-square overflow-hidden">
              <ComingSoon />
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {pack.images.map((img, n) => (
            <li key={img.id} className="card-soft overflow-hidden">
              <div className="aspect-square bg-muted">
                {img.thumbUrl ? (
                  <img src={img.thumbUrl} alt={img.title || `Estampa ${n + 1}`} loading="lazy" className="size-full object-cover" />
                ) : (
                  <ComingSoon />
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2"><p className="line-clamp-1 text-sm font-semibold">{img.title || `Estampa ${n + 1}`}</p><FavoriteButton imageId={img.id} /></div>
                {locked ? (
                  <Button size="sm" variant="outline" className="w-full" onClick={unlock}>
                    <Lock /> Desbloquear
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="wine"
                    className="w-full"
                    disabled={!!busy}
                    onClick={() => run({ type: "studio", packId: pack.id, imageId: img.id })}
                  >
                    {busy === "studio" + img.id ? <Loader2 className="animate-spin" /> : <Wand2 />} Usar no estúdio
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <PackSignupDialog action={ask} onClose={() => setAsk(null)} />
    </div>
  );
}
