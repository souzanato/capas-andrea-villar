import Link from "next/link";
import CoverWizard from "@/components/CoverWizard";

export default function NewCoverPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-10 pb-6 border-b border-border">
        <p className="text-xs text-foreground-mute mb-2">
          <Link href="/dashboard" className="hover:text-foreground-soft transition-colors">
            ← Voltar para suas capas
          </Link>
        </p>
        <h1 className="text-2xl font-medium text-foreground tracking-tight">
          Nova capa
        </h1>
        <p className="text-sm text-foreground-soft mt-1">
          Capas que impulsionam — gerada com identidade editorial.
        </p>
      </div>

      <CoverWizard />
    </div>
  );
}
