import { cn } from "@/lib/utils";

/** Bloco neutro para quando ainda não há imagem. */
export function ComingSoon({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center border-2 border-dashed border-gold bg-foreground text-sm font-medium text-gold-light",
        className,
      )}
    >
      Imagem em breve
    </div>
  );
}
