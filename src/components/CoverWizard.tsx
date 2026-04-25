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
import Step4ContentType from "@/components/wizard/Step4ContentType";
import Step5Palette from "@/components/wizard/Step5Palette";
import Step6AccentColor from "@/components/wizard/Step6AccentColor";
import {
  coverFormSchema,
  type CoverFormData,
} from "@/lib/validators/cover";

const STEP_FIELDS: Record<number, (keyof CoverFormData)[]> = {
  1: ["title"],
  2: [],
  3: ["format"],
  4: ["contentType", "customContentType"],
  5: ["palette", "customPalette"],
  6: ["accentColor"],
};

function getHexArray(val: string | undefined): string[] {
  if (!val) return [];
  return val
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^#[0-9A-Fa-f]{6}$/.test(s));
}

export default function CoverWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Feedback dinâmico de progresso durante a geração
  useEffect(() => {
    if (!isGenerating) {
      setGenerationPhase("");
      return;
    }

    const phases = [
      { delay: 0, text: "Lendo sua imagem..." },
      { delay: 6000, text: "Definindo a tipografia editorial..." },
      { delay: 14000, text: "Calibrando proporções e cores..." },
      { delay: 25000, text: "Compondo a capa..." },
      { delay: 40000, text: "Aplicando os últimos toques..." },
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
      contentType: "",
      customContentType: "",
      palette: "",
      customPalette: "",
      accentColor: "",
    },
  });

  const { watch } = form;
  const palette = watch("palette");
  const customPalette = watch("customPalette");

  const customHexColors = getHexArray(customPalette);
  const showStep6 = palette === "andrea" || customHexColors.length >= 2;
  const maxSteps = showStep6 ? 6 : 5;
  const progressValue = ((step - 1) / maxSteps) * 100;

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
      formData.append(
        "contentType",
        values.contentType === "outro" && values.customContentType
          ? values.customContentType
          : values.contentType
      );
      formData.append("palette", values.palette);

      if (values.accentColor) {
        formData.append("accentColor", values.accentColor);
      }
      if (values.palette === "custom" && values.customPalette) {
        formData.append("customPalette", values.customPalette);
      }

      formData.append("imageFile", imageFile);

      // ── PRIMEIRA CHAMADA: criar cover (upload da imagem) ──
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
          throw new Error("Upload da imagem demorou demais. Tente uma imagem menor.");
        }
        throw err;
      }

      // ── SEGUNDA CHAMADA: gerar prompt + imagem (GPT + Gemini) ──
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
          // Mesmo se falhar, redireciona — a página /cover/[id] mostra o status FAILED
          router.push(`/cover/${coverId}`);
          return;
        }

        router.push(`/cover/${coverId}`);
      } catch (err) {
        clearTimeout(genTimeoutId);

        if (err instanceof DOMException && err.name === "AbortError") {
          // Mesmo no timeout, redireciona — backend pode estar processando ainda
          toast.error(
            "A geração está demorando mais que o esperado. Verificando status..."
          );
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
        {/* Progresso */}
        <div className="space-y-2">
          <Progress value={progressValue} className="h-2" />
          <p className="text-sm text-muted-foreground text-right">
            Passo {step} de {maxSteps}
          </p>
        </div>

        {/* Card do formulário com fundo branco */}
        <div className="bg-background-elevated rounded-xl p-4 sm:p-8 border border-border">
        {/* Steps */}
        {step === 1 && <Step1Title />}
        {step === 2 && (
          <Step2Image
            imageFile={imageFile}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
          />
        )}
        {step === 3 && <Step3Format />}
        {step === 4 && <Step4ContentType />}
        {step === 5 && <Step5Palette />}
        {step === 6 && <Step6AccentColor customColors={customHexColors} />}

        {/* Loading / erro */}
        {isGenerating && (
          <div className="text-center space-y-2 py-4">
            <p className="text-sm text-muted-foreground animate-pulse">
              {generationPhase || "Gerando prompt via IA..."}
            </p>
          </div>
        )}
        {submitError && (
          <p className="text-sm text-destructive text-center">{submitError}</p>
        )}

        {/* Navegação */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            Voltar
          </Button>

          {step < maxSteps ? (
            <Button onClick={handleNext}>Próximo</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isGenerating || !imageFile}
            >
              {isGenerating ? "Gerando prompt..." : isSubmitting ? "Criando..." : "Criar capa"}
            </Button>
          )}
        </div>
      </div>
      </div>
    </FormProvider>
  );
}
