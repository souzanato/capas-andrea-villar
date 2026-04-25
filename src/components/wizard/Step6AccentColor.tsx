"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { CoverFormData } from "@/lib/validators/cover";
import { ACCENT_COLORS_ANDREA } from "@/lib/validators/cover";

interface Step6AccentColorProps {
  customColors?: string[];
}

export default function Step6AccentColor({
  customColors,
}: Step6AccentColorProps) {
  const { control } = useFormContext<CoverFormData>();

  const colors =
    customColors && customColors.length >= 2
      ? customColors.map((hex) => ({ hex, label: hex }))
      : ACCENT_COLORS_ANDREA;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Cor de destaque</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha a cor principal que dará o tom emocional da capa.
        </p>
      </div>

      <FormField
        control={control}
        name="accentColor"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-3 gap-4">
              {colors.map(({ hex, label }) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => field.onChange(hex)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-lg border p-6 transition-all",
                    field.value === hex
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div
                    className="h-16 w-16 rounded-full border-2 border-border shadow-sm"
                    style={{ backgroundColor: hex }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-mono">{hex}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
