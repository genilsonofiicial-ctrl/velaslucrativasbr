import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import { savePendingAction, type PackAction } from "@/lib/pack-actions";

export function PackSignupDialog({ action, onClose }: { action: PackAction | null; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [agree, setAgree] = useState(false);
  const [news, setNews] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!action) return;
    if (!agree) {
      toast.error("Marque que concorda em receber o pack por e-mail.");
      return;
    }
    setLoading(true);
    savePendingAction(action, news);
    void track("pack_signup_started", { template_id: action.packId, action: action.type });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href.split("#")[0] ?? window.location.href },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o link. Confira o e-mail e tente de novo.");
      return;
    }
    setSent(true);
  }

  return (
    <Dialog
      open={!!action}
      onOpenChange={(o) => {
        if (!o) {
          setSent(false);
          onClose();
        }
      }}
    >
      <DialogContent className="rounded-3xl sm:max-w-md">
        {sent ? (
          <div className="flex flex-col items-center py-4 text-center">
            <MailCheck className="size-10 text-gold" />
            <DialogTitle className="mt-3 font-display text-2xl text-primary">Confira seu e-mail</DialogTitle>
            <DialogDescription className="mt-2">
              Enviamos um link para <strong>{email}</strong>. Ao tocar nele, você volta para esta página e o pack continua de
              onde parou.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-primary">Receba seu pack grátis</DialogTitle>
              <DialogDescription>Informe seu e-mail. Você recebe um link para entrar, sem senha.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pack-email">E-mail</Label>
                <Input
                  id="pack-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" required />
                <span>
                  Concordo em receber este pack por e-mail e li a{" "}
                  <Link to="/privacidade" target="_blank" className="font-medium text-primary underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={news} onCheckedChange={(v) => setNews(v === true)} className="mt-0.5" />
                <span>Quero receber novidades e novos packs</span>
              </label>
              <Button type="submit" variant="gold" className="w-full" disabled={loading || !agree}>
                {loading && <Loader2 className="animate-spin" />} Enviar link
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
