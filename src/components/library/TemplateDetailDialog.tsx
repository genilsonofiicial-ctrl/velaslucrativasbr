import { Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TemplateWithUrl } from "@/lib/templates";

export function TemplateDetailDialog({
  template,
  onClose,
  onUse,
}: {
  template: TemplateWithUrl | null;
  onClose: () => void;
  onUse: (t: TemplateWithUrl) => void;
}) {
  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-lg">
        {template && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-primary">{template.title}</DialogTitle>
              <DialogDescription>
                {[template.theme, template.occasion].filter(Boolean).join(" · ")}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-2xl bg-muted">
              {template.thumbUrl && (
                <img
                  src={template.thumbUrl}
                  alt={`Prévia do modelo ${template.title}`}
                  className="max-h-[50vh] w-full object-contain"
                />
              )}
            </div>
            {template.description && <p className="text-foreground/85">{template.description}</p>}
            {template.is_premium && (
              <p className="flex gap-2 rounded-xl bg-accent p-3 text-sm text-primary">
                <Crown className="mt-0.5 size-4 shrink-0 text-gold" />
                Modelo Pro: você pode testar à vontade. Para baixar, é preciso o plano Pro.
              </p>
            )}
            {template.license_note && (
              <p className="text-xs text-muted-foreground">Licença: {template.license_note}</p>
            )}
            <Button variant="gold" size="lg" className="w-full" onClick={() => onUse(template)}>
              <Sparkles /> Usar na minha vela
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
