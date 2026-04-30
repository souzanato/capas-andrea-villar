"use client";

import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import type { CoverFormData } from "@/lib/validators/cover";
import { ACCENT_COLORS_ANDREA } from "@/lib/validators/cover";

export default function Step6AccentColor() {
  const { control } = useFormContext<CoverFormData>();

  // Cada slot pode ter cor customizada — começa com os defaults
  const [slotColors, setSlotColors] = useState<string[]>(
    ACCENT_COLORS_ANDREA.map((c) => c.hex)
  );

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {slotColors.map((hex, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  {/* Botão de seleção da cor */}
                  <button
                    type="button"
                    onClick={() => field.onChange(hex)}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-lg border p-4 sm:p-6 transition-all",
                      field.value === hex
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div
                      className="h-12 w-12 sm:h-16 sm:w-16 rounded-full border-2 border-border shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                    <p className="text-xs font-mono">{hex}</p>
                  </button>

                  {/* Botão Personalizar */}
                  <button
                    type="button"
                    onClick={() => inputRefs.current[idx]?.click()}
                    className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <Pipette className="h-3 w-3" />
                    Personalizar
                  </button>

                  {/* Input color nativo — invisível */}
                  <input
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="color"
                    value={hex}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      const updated = [...slotColors];
                      updated[idx] = newColor;
                      setSlotColors(updated);
                      // Se esse slot estava selecionado, atualiza a seleção também
                      if (field.value === hex) {
                        field.onChange(newColor);
                      }
                    }}
                    className="sr-only"
                  />
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
