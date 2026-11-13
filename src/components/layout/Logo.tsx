import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Stúdio Velas Lucrativas — início">
      <span className="flex size-9 items-center justify-center rounded-full bg-gradient-gold text-gold-foreground shadow-soft">
        <Flame className="size-5" />
      </span>
      <span className="font-display text-lg font-semibold leading-none text-wine-foreground">
        Stúdio <span className="text-gold-light">Velas Lucrativas</span>
      </span>
    </Link>
  );
}
