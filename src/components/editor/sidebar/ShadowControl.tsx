"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ShadowConfig {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
}

interface ShadowControlProps {
  value: ShadowConfig | null;
  onChange: (value: ShadowConfig | null) => void;
}

const QUICK_COLORS = [
  { hex: "#000000", label: "Preto" },
  { hex: "#1F3247", label: "Navy" },
  { hex: "#FFFFFF", label: "Branco" },
];

export default function ShadowControl({ value, onChange }: ShadowControlProps) {
  const isEnabled = value?.enabled ?? false;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      onChange({
        enabled: true,
        color: value?.color ?? "#000000",
        blur: value?.blur ?? 8,
        offsetX: value?.offsetX ?? 0,
        offsetY: value?.offsetY ?? 4,
        opacity: value?.opacity ?? 0.4,
      });
    } else {
      onChange(value ? { ...value, enabled: false } : null);
    }
  };

  const update = (changes: Partial<ShadowConfig>) => {
    onChange({
      enabled: true,
      color: value?.color ?? "#000000",
      blur: value?.blur ?? 8,
      offsetX: value?.offsetX ?? 0,
      offsetY: value?.offsetY ?? 4,
      opacity: value?.opacity ?? 0.4,
      ...changes,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Sombra (Shadow)</Label>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      </div>

      {isEnabled && value && (
        <div className="space-y-3 pl-2 border-l-2 border-border">
          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground">Cor</Label>
            <div className="flex items-center gap-1 flex-wrap">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => update({ color: c.hex })}
                  title={c.label}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-transform",
                    value.color.toUpperCase() === c.hex.toUpperCase()
                      ? "border-foreground scale-110"
                      : "border-border hover:scale-105"
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <input
                type="color"
                value={value.color}
                onChange={(e) => update({ color: e.target.value.toUpperCase() })}
                className="h-5 w-5 rounded cursor-pointer border border-border ml-auto"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">Difusão</Label>
              <span className="text-[11px] text-muted-foreground font-mono">{value.blur}</span>
            </div>
            <Slider
              value={[value.blur]}
              onValueChange={(v) => update({ blur: v[0] })}
              min={0}
              max={50}
              step={1}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground">Off X</Label>
                <span className="text-[11px] text-muted-foreground font-mono">{value.offsetX}</span>
              </div>
              <Slider
                value={[value.offsetX]}
                onValueChange={(v) => update({ offsetX: v[0] })}
                min={-30}
                max={30}
                step={1}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground">Off Y</Label>
                <span className="text-[11px] text-muted-foreground font-mono">{value.offsetY}</span>
              </div>
              <Slider
                value={[value.offsetY]}
                onValueChange={(v) => update({ offsetY: v[0] })}
                min={-30}
                max={30}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">Opacidade</Label>
              <span className="text-[11px] text-muted-foreground font-mono">{value.opacity.toFixed(2)}</span>
            </div>
            <Slider
              value={[value.opacity]}
              onValueChange={(v) => update({ opacity: v[0] })}
              min={0}
              max={1}
              step={0.05}
            />
          </div>
        </div>
      )}
    </div>
  );
}
