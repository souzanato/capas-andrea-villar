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
import type { CoverFormData } from "@/lib/validators/cover";
import { CONTENT_TYPES } from "@/lib/validators/cover";
import {
  Baby,
  Mic,
  Flame,
  GraduationCap,
  Newspaper,
  ShoppingBag,
  Church,
  Trophy,
  Smile,
  MoreHorizontal,
} from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  maternidade: <Baby className="h-6 w-6" />,
  podcast: <Mic className="h-6 w-6" />,
  motivacional: <Flame className="h-6 w-6" />,
  educacional: <GraduationCap className="h-6 w-6" />,
  noticia: <Newspaper className="h-6 w-6" />,
  vendas: <ShoppingBag className="h-6 w-6" />,
  religioso: <Church className="h-6 w-6" />,
  esportes: <Trophy className="h-6 w-6" />,
  humor: <Smile className="h-6 w-6" />,
  outro: <MoreHorizontal className="h-6 w-6" />,
};

export default function Step4ContentType() {
  const { control, watch } = useFormContext<CoverFormData>();
  const contentType = watch("contentType");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tipo de conteúdo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione o tema da capa.
        </p>
      </div>

      <FormField
        control={control}
        name="contentType"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => field.onChange(type)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                    field.value === type
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  )}
                >
                  {ICONS[type]}
                  <span className="text-xs font-medium capitalize">
                    {type}
                  </span>
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {contentType === "outro" && (
        <FormField
          control={control}
          name="customContentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descreva o tipo de conteúdo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: receitas, viagem, moda..."
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
