import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CmField({
  id,
  label,
  value,
  onChange,
  unit = "cm",
  invalid = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  invalid?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
          className="h-12 rounded-xl pr-12 text-lg font-semibold"
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  );
}
