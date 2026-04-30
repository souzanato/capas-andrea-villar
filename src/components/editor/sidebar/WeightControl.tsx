"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const WEIGHTS = [
  { value: 400, label: "Regular" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
  { value: 800, label: "ExtraBold" },
  { value: 900, label: "Black" },
];

interface WeightControlProps {
  value: number;
  onChange: (value: number) => void;
  fontFamily?: string;
}

export default function WeightControl({ value, onChange, fontFamily }: WeightControlProps) {
  const isWeightFixed = fontFamily === "Anton";

  if (isWeightFixed) {
    return (
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Peso</Label>
        <p className="text-xs text-muted-foreground italic">
          Anton tem peso único (Black)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Peso</Label>
      <div className="grid grid-cols-6 gap-1">
        {WEIGHTS.map((w) => (
          <button
            key={w.value}
            type="button"
            onClick={() => onChange(w.value)}
            className={cn(
              "px-2 py-1.5 rounded border text-xs transition-colors",
              value === w.value
                ? "border-primary bg-primary/10 text-foreground font-medium"
                : "border-border bg-background hover:bg-muted text-muted-foreground"
            )}
          >
            {w.label}
          </button>
        ))}
      </div>
    </div>
  );
}
