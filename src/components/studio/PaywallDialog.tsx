import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { config } from "@/config";
import { useAuth } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";
import { FREE_EXPORTS_PER_MONTH } from "@/lib/plan";

export type PaywallReason = "premium" | "limit";

export function PaywallDialog({ reason, onClose }: { reason: PaywallReason | null; onClose: () => void }) {
  const { user } = useAuth();

  useEffect(() => {
    if (reason) track("paywall_seen", { reason });
  }, [reason]);

  function goPro() {
    track("pro_clicked", { reason });
    if (!config.proPaymentUrl.startsWith("http")) {
      toast.info("O link do plano Pro ainda não foi configurado. Volte em breve!");
      return;
    }
    window.open(config.proPaymentUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog open={!!reason} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-14 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground">
            <Crown className="size-7" />
          </div>
          <DialogTitle className="text-center font-display text-2xl text-primary">
            {reason === "premium" ? "Este modelo é do plano Pro" : "Você usou suas exportações do mês"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {reason === "premium"
              ? "Você pode testar à vontade. Para baixar modelos Pro, é preciso o plano Pro."
              : `O plano gratuito inclui ${FREE_EXPORTS_PER_MONTH} exportações por mês. Com o Pro, você exporta sem limite.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Button variant="gold" size="lg" className="w-full" onClick={goPro}>
            Quero o Pro
          </Button>
          {!user && (
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/entrar" search={{ redirect: "/estudio" }}>
                Já tenho conta — entrar
              </Link>
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
