import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Crown, ImagePlus, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TemplateBrowser } from "@/components/library/TemplateBrowser";
import { useAuth } from "@/hooks/useAuth";
import { useArtImage, loadImage } from "@/hooks/useArtImage";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { LOW_DPI_THRESHOLD, MSG_LOW_DPI, effectiveDpi } from "@/lib/candle";
import { extensionFor, validateImageFile } from "@/lib/upload";
import { useCandleCalc, useStudio } from "@/stores/studio";
import { PackStrip } from "./PackStrip";

export function StepArt() {
  const template = useStudio((s) => s.template);
  const custom = useStudio((s) => s.custom);
  const inputs = useStudio((s) => s.inputs);
  const setCustom = useStudio((s) => s.setCustom);
  const setCustomPath = useStudio((s) => s.setCustomPath);
  const setStep = useStudio((s) => s.setStep);
  const calc = useCandleCalc();
  const art = useArtImage();
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const dpi =
    custom && art.image && calc.ok ? effectiveDpi(art.image.width, calc.result.artWidth) : null;

  async function onFile(file: File) {
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setUploading(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = await loadImage(objectUrl);
      setCustom(
        { objectUrl, path: null, name: file.name, widthPx: img.naturalWidth, heightPx: img.naturalHeight },
        file,
      );
      const fileDpi = calc.ok ? Math.round(effectiveDpi(img.naturalWidth, calc.result.artWidth)) : null;
      track("custom_image_uploaded", {
        mode: inputs.mode,
        sheet: inputs.sheet,
        width_px: img.naturalWidth,
        height_px: img.naturalHeight,
        dpi: fileDpi,
      });
      if (user) {
        const path = `${user.id}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
        const { error } = await supabase.storage
          .from("user-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) toast.error("A imagem está no estúdio, mas não foi guardada na sua conta.");
        else setCustomPath(path);
      }
      toast.success("Imagem pronta para usar!");
    } catch {
      toast.error("Não foi possível abrir esta imagem. Tente outra.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card-soft flex flex-col gap-4 p-5 sm:flex-row sm:items-center md:p-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
            {art.loading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : art.image && art.image.source instanceof HTMLImageElement ? (
              <img src={art.image.source.src} alt="Arte escolhida" className="size-full object-cover" />
            ) : (
              <ImagePlus className="size-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Arte escolhida</p>
            <p className="font-display text-lg text-primary">
              {template?.title ?? custom?.name ?? "Nenhuma ainda"}
            </p>
            {template?.isPremium && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Crown className="size-3 text-gold" /> Pack premium
              </span>
            )}
            {art.error && <p className="text-sm text-destructive">{art.error}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label="Escolher imagem do aparelho"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            Usar minha própria imagem
          </Button>
          <span className="text-xs text-muted-foreground">PNG, JPG ou WEBP, até 10 MB</span>
        </div>
      </section>

      {dpi !== null && dpi < LOW_DPI_THRESHOLD && (
        <p className="flex gap-2 rounded-2xl bg-destructive-soft p-4 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <span>
            <strong>{MSG_LOW_DPI}.</strong> Resolução estimada: {Math.round(dpi)} DPI (o ideal é 150 ou
            mais). Use uma imagem maior, se tiver.
          </span>
        </p>
      )}

      <PackStrip />

      <section>
        <h2 className="mb-1 text-xl font-semibold text-primary">Ou escolha um pack</h2>
        <p className="mb-3 text-sm text-muted-foreground">Abra um pack e toque em “Usar no estúdio” na estampa que quiser.</p>
        <TemplateBrowser selectedId={template?.packId ?? template?.id} />
      </section>

      <div className="flex justify-between gap-3">
        <Button variant="outline" size="lg" onClick={() => setStep(1)}>
          <ArrowLeft /> Medidas
        </Button>
        <Button variant="gold" size="lg" disabled={!template && !custom} onClick={() => setStep(3)}>
          Ajustar <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
