"use client";

import Link from "next/link";
import { ArrowLeft, Code2, Info, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverStatusBadge } from "./CoverStatusBadge";
import DetailsDialog from "./DetailsDialog";
import DebugDialog from "./DebugDialog";
import { useState } from "react";
import type { Status } from "@prisma/client";
import type { CoverLayout } from "@/lib/editor/layout-schema";
import type { SaveStatus } from "@/hooks/useSaveLayout";

interface EditorHeaderProps {
  title: string;
  status: string;
  createdAt: string;
  format: string;
  accentColor: string | null;
  baseImage: { id: string; width: number; height: number; mimeType: string } | null;
  layout: CoverLayout | null;
  coverId: string;
  saveStatus?: SaveStatus;
  onSave?: () => void;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const config = {
    pending: { text: "Alterações não salvas", className: "text-muted-foreground" },
    saving: { text: "Salvando...", className: "text-muted-foreground animate-pulse" },
    saved: { text: "✓ Salvo", className: "text-green-600 dark:text-green-400" },
    error: { text: "Erro ao salvar", className: "text-destructive" },
  }[status];

  if (!config) return null;

  return (
    <span className={`text-xs ${config.className} transition-all`}>
      {config.text}
    </span>
  );
}

export default function EditorHeader({
  title,
  status,
  createdAt,
  format,
  accentColor,
  baseImage,
  layout,
  coverId,
  saveStatus,
  onSave,
}: EditorHeaderProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>

        <div className="h-5 w-px bg-border" />

        <h1 className="font-semibold truncate">{title}</h1>

        <CoverStatusBadge status={status as Status} />

        <SaveIndicator status={saveStatus ?? "idle"} />
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          disabled={saveStatus === "saving"}
        >
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setDetailsOpen(true)}
        >
          <Info className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Detalhes</span>
        </Button>

        {layout && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDebugOpen(true)}
            title="Ver JSON do layout (debug)"
          >
            <Code2 className="h-4 w-4" />
            <span className="sr-only">Debug</span>
          </Button>
        )}
      </div>

      <DetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={title}
        format={format}
        accentColor={accentColor}
        baseImage={baseImage}
        createdAt={createdAt}
        coverId={coverId}
      />

      {layout && (
        <DebugDialog
          open={debugOpen}
          onOpenChange={setDebugOpen}
          layout={layout}
        />
      )}
    </div>
  );
}
