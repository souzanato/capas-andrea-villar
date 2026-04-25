"use client";

import { useFormContext } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { CoverFormData } from "@/lib/validators/cover";

export default function Step1Title() {
  const { control } = useFormContext<CoverFormData>();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Qual o título da capa?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escreva o texto principal que aparecerá na capa.
        </p>
      </div>

      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Textarea
                placeholder='Insira um título de até 40 caracteres'
                className="min-h-[100px] resize-none"
                maxLength={100}
                {...field}
              />
            </FormControl>
            <div className="flex justify-between">
              <FormMessage />
              <span className="text-xs text-muted-foreground ml-auto">
                {field.value.length}/100
              </span>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
