"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function LineHeightControl({ value, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Espaço entre linhas</Label>
        <span className="text-[11px] text-muted-foreground font-mono">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={0.8}
        max={2}
        step={0.05}
      />
    </div>
  );
}
