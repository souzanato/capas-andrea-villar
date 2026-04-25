"use client";

import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import type { CoverFormData } from "@/lib/validators/cover";
import { FORMAT_LABELS } from "@/lib/validators/cover";

const FORMATS = [
  {
    value: "REELS_9_16",
    label: FORMAT_LABELS["REELS_9_16"],
    aspect: "aspect-[9/16]",
  },
  {
    value: "FEED_1_1",
    label: FORMAT_LABELS["FEED_1_1"],
    aspect: "aspect-square",
  },
  {
    value: "CAROUSEL_4_5",
    label: FORMAT_LABELS["CAROUSEL_4_5"],
    aspect: "aspect-[4/5]",
  },
];

export default function Step3Format() {
  const { control } = useFormContext<CoverFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Qual o formato da capa?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha o formato de acordo com o destino no Instagram.
        </p>
      </div>

      <FormField
        control={control}
        name="format"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  type="button"
                  onClick={() => field.onChange(fmt.value)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-lg border p-3 sm:p-4 transition-all",
                    field.value === fmt.value
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-full max-w-[80px] rounded-md bg-muted flex items-center justify-center",
                      fmt.aspect
                    )}
                  >
                    <div className="text-xs text-muted-foreground py-1">
                      {fmt.value.split("_").slice(1).join(":")}
                    </div>
                  </div>
                  <span className="text-sm font-medium leading-tight text-center">
                    {fmt.label}
                  </span>
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
