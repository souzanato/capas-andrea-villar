"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface GlowConfig {
  enabled: boolean;
  color: string;
  blur: number;
  opacity: number;
}

interface GlowControlProps {
  value: GlowConfig | null;
  defaultColor: string;
  onChange: (value: GlowConfig | null) => void;
}

const QUICK_COLORS = [
  { hex: "#FFFFFF", label: "Branco" },
  { hex: "#1F4E8C", label: "Azul" },
  { hex: "#C8644D", label: "Vermelho" },
  { hex: "#2D7A6E", label: "Verde" },
  { hex: "#000000", label: "Preto" },
];

const DEFAULT_GLOW_ON = {
  enabled: true,
  color: "#FFFFFF",
  blur: 20,
  opacity: 0.9,
};

export default function GlowControl({ value, defaultColor, onChange }: GlowControlProps) {
  const isEnabled = value?.enabled ?? false;

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      onChange(DEFAULT_GLOW_ON);
    } else {
      onChange(value ? { ...value, enabled: false } : null);
    }
  };

  const update = (changes: Partial<GlowConfig>) => {
    onChange({
      ...DEFAULT_GLOW_ON,
      color: value?.color ?? DEFAULT_GLOW_ON.color,
      blur: value?.blur ?? DEFAULT_GLOW_ON.blur,
      opacity: value?.opacity ?? DEFAULT_GLOW_ON.opacity,
      ...changes,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">Brilho (Glow)</Label>
        <Switch checked={isEnabled} onCheckedChange={handleToggle} />
      </div>

      {isEnabled && value && (
        <div className="space-y-3 pl-2 border-l-2 border-border">
          {/* Cor */}
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
              <input
                type="text"
                value={value.color}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) update({ color: v.toUpperCase() });
                }}
                className="w-16 h-5 text-[10px] font-mono rounded border border-border px-1 bg-background"
              />
            </div>
          </div>

          {/* Difusão (blur) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] text-muted-foreground">Difusão</Label>
              <span className="text-[11px] text-muted-foreground font-mono">{value.blur}</span>
            </div>
            <Slider
              value={[value.blur]}
              onValueChange={(v) => update({ blur: v[0] })}
              min={0}
              max={40}
              step={1}
            />
          </div>

          {/* Opacidade */}
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
