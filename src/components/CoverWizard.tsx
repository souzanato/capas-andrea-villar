"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Step1Title from "@/components/wizard/Step1Title";
import Step2Image from "@/components/wizard/Step2Image";
import Step3Format from "@/components/wizard/Step3Format";
import Step6AccentColor from "@/components/wizard/Step6AccentColor";
import {
  coverFormSchema,
  type CoverFormData,
} from "@/lib/validators/cover";

const STEP_FIELDS: Record<number, (keyof CoverFormData)[]> = {
  1: ["title"],
  2: [],
  3: ["format"],
  4: ["accentColor"],
};

const TOTAL_STEPS = 4;

export default function CoverWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGenerating) {
      setGenerationPhase("");
      return;
    }

    const phases = [
      { delay: 0, text: "Lendo sua imagem..." },
      { delay: 8000, text: "Compondo a capa..." },
      { delay: 18000, text: "Aplicando os últimos toques..." },
    ];

    const timers = phases.map(({ delay, text }) =>
      setTimeout(() => setGenerationPhase(text), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [isGenerating]);

  const form = useForm<CoverFormData>({
    resolver: zodResolver(coverFormSchema),
    defaultValues: {
      title: "",
      format: undefined,
      accentColor: "",
    },
  });

  const progressValue = ((step - 1) / TOTAL_STEPS) * 100;

  const handleImageChange = useCallback(
    (file: File | null, preview: string | null) => {
      setImageFile(file);
      setImagePreview(preview);
    },
    []
  );

  async function handleNext() {
    const fields = STEP_FIELDS[step] || [];
    if (fields.length === 0) {
      if (step === 2 && !imageFile) {
        toast.error("Envie uma imagem antes de continuar.");
        return;
      }
      setStep((s) => s + 1);
      return;
    }
    const valid = await form.trigger(fields);
    if (valid) setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const valid = await form.trigger();
    if (!valid || !imageFile) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const values = form.getValues();
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("format", values.format!);
      formData.append("accentColor", values.accentColor);
      formData.append("imageFile", imageFile);

      const uploadController = new AbortController();
      const uploadTimeoutId = setTimeout(() => uploadController.abort(), 30_000);

      let coverId: string;
      try {
        const res = await fetch("/api/covers", {
          method: "POST",
          body: formData,
          signal: uploadController.signal,
        });

        clearTimeout(uploadTimeoutId);

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao criar capa");
        }

        const json = await res.json();
        coverId = json.coverId;
      } catch (err) {
        clearTimeout(uploadTimeoutId);
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new Error("Upload demorou demais. Tente uma imagem menor.");
        }
        throw err;
      }

      setIsGenerating(true);

      const genController = new AbortController();
      const genTimeoutId = setTimeout(() => genController.abort(), 180_000);

      try {
        const genRes = await fetch(`/api/covers/${coverId}/generate`, {
          method: "POST",
          signal: genController.signal,
        });

        clearTimeout(genTimeoutId);

        if (!genRes.ok) {
          router.push(`/cover/${coverId}`);
          return;
        }

        router.push(`/cover/${coverId}`);
      } catch (err) {
        clearTimeout(genTimeoutId);

        if (err instanceof DOMException && err.name === "AbortError") {
          toast.error("A geração está demorando mais que o esperado. Verificando status...");
          router.push(`/cover/${coverId}`);
          return;
        }

        throw err;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar capa";
      toast.error(message);
      setSubmitError(message);
      setIsSubmitting(false);
      setIsGenerating(false);
    }
  }

  return (
    <FormProvider {...form}>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <Progress value={progressValue} className="h-2" />
          <p className="text-sm text-muted-foreground text-right">
            Passo {step} de {TOTAL_STEPS}
          </p>
        </div>

        <div className="bg-background-elevated rounded-xl p-4 sm:p-8 border border-border">
          {step === 1 && <Step1Title />}
          {step === 2 && (
            <Step2Image
              imageFile={imageFile}
              imagePreview={imagePreview}
              onImageChange={handleImageChange}
            />
          )}
          {step === 3 && <Step3Format />}
          {step === 4 && <Step6AccentColor />}

          {isGenerating && (
            <div className="text-center space-y-2 py-4">
              <p className="text-sm text-muted-foreground animate-pulse">
                {generationPhase || "Gerando capa..."}
              </p>
            </div>
          )}
          {submitError && (
            <p className="text-sm text-destructive text-center">{submitError}</p>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
            >
              Voltar
            </Button>

            {step < TOTAL_STEPS ? (
              <Button onClick={handleNext}>Próximo</Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isGenerating || !imageFile}
              >
                {isGenerating ? "Gerando..." : isSubmitting ? "Criando..." : "Criar capa"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
