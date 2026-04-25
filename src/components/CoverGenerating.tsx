"use client";

import { Status } from "@prisma/client";
import { Logo } from "@/components/brand/Logo";

interface CoverGeneratingProps {
  status: Status;
}

const PHASE_MESSAGES: Partial<Record<Status, { primary: string; secondary: string }>> = {
  PENDING: {
    primary: "Preparando sua capa",
    secondary: "Iniciando o pipeline editorial",
  },
  GENERATING_PROMPT: {
    primary: "Definindo a tipografia",
    secondary: "Calibrando hierarquia, fontes e proporções",
  },
  GENERATING_IMAGE: {
    primary: "Compondo a capa",
    secondary: "Aplicando o glow e integrando à foto",
  },
};

export default function CoverGenerating({ status }: CoverGeneratingProps) {
  const message = PHASE_MESSAGES[status] ?? PHASE_MESSAGES.GENERATING_PROMPT!;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-8">
        <Logo size={48} className="opacity-90" />
        <div
          className="absolute inset-0 -m-4 rounded-full animate-pulse"
          style={{
            background: "radial-gradient(circle, hsl(var(--andrea-rose) / 0.15) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      </div>

      <h2 className="text-lg font-medium text-foreground tracking-tight mb-1.5 text-center">
        {message.primary}
      </h2>
      <p className="text-sm text-foreground-soft text-center max-w-sm">
        {message.secondary}
      </p>

      {/* Linha de progresso indeterminada */}
      <div className="mt-8 w-48 h-[2px] bg-background-subtle rounded-full overflow-hidden">
        <div
          className="h-full w-1/3 rounded-full animate-[slide_2s_ease-in-out_infinite]"
          style={{
            background: "hsl(var(--andrea-rose))",
          }}
        />
      </div>

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-200%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(600%); }
        }
      `}</style>
    </div>
  );
}
