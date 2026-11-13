import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const HELPED = ["Sim", "Mais ou menos", "Não"] as const;
const PAY = ["Nada", "Até R$ 10", "R$ 10 a R$ 20", "R$ 20 a R$ 40", "Mais de R$ 40"] as const;

function Choice({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly string[];
  value: string | null;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "focus-ring min-h-10 rounded-full border-2 px-4 text-sm font-medium transition-colors",
            value === o ? "border-gold bg-accent text-primary" : "border-border hover:border-gold/50",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function SurveyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [helped, setHelped] = useState<string | null>(null);
  const [pay, setPay] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { data } = await supabase.auth.getSession();
    const { error } = await supabase.from("feedback").insert({
      user_id: data.session?.user.id ?? null,
      helped: helped === "Sim" ? true : helped === "Não" ? false : null,
      helped_answer: helped,
      willing_to_pay: pay,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível enviar agora. Obrigada mesmo assim!");
    } else {
      toast.success("Obrigada pela sua opinião!");
    }
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-primary">Uma pergunta rápida</DialogTitle>
          <DialogDescription>Leva 10 segundos e ajuda a melhorar o app.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Isso te ajudou a preparar a arte?</p>
            <Choice label="Isso te ajudou" options={HELPED} value={helped} onChange={setHelped} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Quanto você pagaria por mês por uma ferramenta assim?</p>
            <Choice label="Quanto pagaria" options={PAY} value={pay} onChange={setPay} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faltou" className="text-sm font-semibold">
              O que faltou? <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="faltou"
              rows={3}
              maxLength={1000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Agora não
            </Button>
            <Button variant="gold" className="flex-1" disabled={saving || (!helped && !pay && !comment.trim())} onClick={submit}>
              {saving && <Loader2 className="animate-spin" />} Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
