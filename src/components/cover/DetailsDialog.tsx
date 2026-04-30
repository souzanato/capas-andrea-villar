"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

interface DetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  format: string;
  accentColor: string | null;
  baseImage: { id: string; width: number; height: number; mimeType: string } | null;
  createdAt: string;
  coverId: string;
}

const FORMAT_LABELS: Record<string, string> = {
  REELS_9_16: "9:16 — Reels/Stories",
  FEED_1_1: "1:1 — Feed quadrado",
  CAROUSEL_4_5: "4:5 — Carrossel",
};

export default function DetailsDialog({
  open,
  onOpenChange,
  title,
  format,
  accentColor,
  baseImage,
  createdAt,
  coverId,
}: DetailsDialogProps) {
  const formatLabel = FORMAT_LABELS[format] ?? format;

  const formattedDate = new Date(createdAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da capa</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <Row label="Título" value={title} />
          <Row label="Formato" value={formatLabel} />

          {accentColor && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground flex-shrink-0">Destaque</span>
              <div className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-border"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="font-mono text-xs">{accentColor}</span>
              </div>
            </div>
          )}

          {baseImage && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-muted-foreground flex-shrink-0">Imagem base</span>
              <div className="flex items-center gap-2 text-right">
                <span className="text-xs text-muted-foreground">
                  {baseImage.width}×{baseImage.height}
                </span>
                <a
                  href={`/api/covers/${coverId}/image?type=base`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Ver
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          <Row label="Criada em" value={formattedDate} muted />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className={muted ? "text-muted-foreground text-xs text-right" : "text-right"}>
        {value}
      </span>
    </div>
  );
}
