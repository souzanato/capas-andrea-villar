"use client";

import { Label } from "@/components/ui/label";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALIGN_OPTIONS = [
  { value: "left" as const, icon: AlignLeft },
  { value: "center" as const, icon: AlignCenter },
  { value: "right" as const, icon: AlignRight },
];

interface AlignControlProps {
  value: "left" | "center" | "right";
  onChange: (value: "left" | "center" | "right") => void;
}

export default function AlignControl({ value, onChange }: AlignControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Alinhamento</Label>
      <div className="flex border border-border rounded-lg overflow-hidden">
        {ALIGN_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex-1 flex items-center justify-center py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
