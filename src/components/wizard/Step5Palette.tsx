"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Palette } from "lucide-react";
import type { CoverFormData } from "@/lib/validators/cover";
import { PALETTE_SWATCHES } from "@/lib/validators/cover";

const PALETTE_OPTIONS = [
  {
    value: "andrea",
    title: "Andrea — suave/feminino",
    swatches: PALETTE_SWATCHES.andrea,
  },
  {
    value: "viral_classic",
    title: "Clássica viral — alta energia",
    swatches: PALETTE_SWATCHES.viral_classic,
  },
  {
    value: "custom",
    title: "Outra (descrever)",
    swatches: [],
    icon: <Palette className="h-6 w-6" />,
  },
];

export default function Step5Palette() {
  const { control, watch } = useFormContext<CoverFormData>();
  const palette = watch("palette");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Paleta de cores</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha o esquema de cores da capa.
        </p>
      </div>

      <FormField
        control={control}
        name="palette"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-3 gap-4">
              {PALETTE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-lg border p-4 transition-all",
                    field.value === opt.value
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  {opt.swatches.length > 0 ? (
                    <div className="flex gap-1.5">
                      {opt.swatches.map((color) => (
                        <div
                          key={color}
                          className="h-8 w-8 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  ) : (
                    opt.icon
                  )}
                  <span className="text-sm font-medium leading-tight text-center">
                    {opt.title}
                  </span>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {palette === "custom" && (
        <FormField
          control={control}
          name="customPalette"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cores (hex separados por vírgula)</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ex: #FF6B6B, #4ECDC4, #45B7D1'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
