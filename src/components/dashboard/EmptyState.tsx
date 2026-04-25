import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

interface EmptyStateProps {
  variant: "no-covers" | "no-results";
  onClearFilters?: () => void;
}

export default function EmptyState({
  variant,
  onClearFilters,
}: EmptyStateProps) {
  if (variant === "no-results") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <p className="text-sm text-foreground-soft">
          Nenhuma capa encontrada com esses filtros.
        </p>
        {onClearFilters && (
          <Button variant="outline" onClick={onClearFilters} className="mt-4">
            Limpar filtros
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="relative mb-6">
        <Logo size={64} className="opacity-90" />
        {/* Halo decorativo */}
        <div
          className="absolute inset-0 -m-6 rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--andrea-rose) / 0.08) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      </div>

      <h2 className="text-xl font-medium text-foreground tracking-tight mb-2">
        Sua primeira capa começa aqui
      </h2>
      <p className="text-sm text-foreground-soft max-w-sm mb-8">
        Cada capa é gerada com identidade editorial — tipografia, cores e composição cuidadosamente calibrados.
      </p>

      <Button asChild>
        <Link href="/new">Criar primeira capa</Link>
      </Button>
    </div>
  );
}
