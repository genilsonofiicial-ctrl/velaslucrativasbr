import { useQuery } from "@tanstack/react-query";

import { ComingSoon } from "@/components/library/ComingSoon";
import { track } from "@/lib/analytics";
import { activeTemplatesQuery } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { useStudio } from "@/stores/studio";

/** Outras estampas do mesmo pack: troca com um clique, sem perder medidas e ajustes. */
export function PackStrip() {
  const template = useStudio((s) => s.template);
  const switchPackImage = useStudio((s) => s.switchPackImage);
  const { data } = useQuery({ ...activeTemplatesQuery, enabled: !!template?.packId });
  const pack = template?.packId ? data?.find((p) => p.id === template.packId) : undefined;
  if (!template?.packId || !pack || pack.images.length < 2) return null;

  return (
    <section className="card-soft p-4">
      <p className="mb-2 text-sm font-semibold text-primary">Outras estampas do pack “{pack.title}”</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {pack.images.map((img, n) => {
          const active = img.id === template.imageId;
          return (
            <button
              key={img.id}
              type="button"
              aria-label={`Usar ${img.title || `Estampa ${n + 1}`}`}
              aria-pressed={active}
              onClick={() => {
                if (active) return;
                switchPackImage({
                  ...template,
                  title: `${pack.title} — ${img.title || `Estampa ${n + 1}`}`,
                  imagePath: img.original_path,
                  imageId: img.id,
                });
                void track("pack_image_switched_in_studio", { template_id: pack.id, image_id: img.id });
              }}
              className={cn(
                "focus-ring size-16 shrink-0 overflow-hidden rounded-xl bg-muted",
                active ? "ring-2 ring-gold" : "opacity-80 hover:opacity-100",
              )}
            >
              {img.thumbUrl ? <img src={img.thumbUrl} alt="" className="size-full object-cover" /> : <ComingSoon className="text-[9px]" />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
