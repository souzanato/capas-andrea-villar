"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const QUICK_COLORS = [
  { hex: "#FFFFFF", label: "Branco" },
  { hex: "#1F4E8C", label: "Azul Calma" },
  { hex: "#C8644D", label: "Vermelho Emocional" },
  { hex: "#2D7A6E", label: "Verde Esperança" },
  { hex: "#1F3247", label: "Navy" },
];

interface ColorControlProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ColorControl({ value, onChange }: ColorControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Cor</Label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {QUICK_COLORS.map((color) => (
          <button
            key={color.hex}
            type="button"
            onClick={() => onChange(color.hex)}
            title={color.label}
            className={cn(
              "h-7 w-7 rounded-full border-2 transition-transform",
              value.toUpperCase() === color.hex.toUpperCase()
                ? "border-foreground scale-110"
                : "border-border hover:scale-105"
            )}
            style={{ backgroundColor: color.hex }}
          />
        ))}
        <div className="ml-auto flex items-center gap-1">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-7 w-7 rounded cursor-pointer border border-border"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                onChange(v.toUpperCase());
              }
            }}
            className="w-20 h-7 text-xs font-mono rounded border border-border px-2 bg-background"
            placeholder="#FFFFFF"
          />
        </div>
      </div>
    </div>
  );
}
