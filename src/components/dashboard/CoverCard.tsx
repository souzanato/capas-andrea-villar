"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CoverStatusBadge } from "@/components/cover/CoverStatusBadge";
import type { Status } from "@prisma/client";

const ASPECT_MAP: Record<string, string> = {
  REELS_9_16: "aspect-[9/16]",
  FEED_1_1: "aspect-square",
  CAROUSEL_4_5: "aspect-[4/5]",
};

interface CoverCardCover {
  id: string;
  title: string;
  format: string;
  status: string;
  contentType: string;
  createdAt: string;
  baseImageId: string | null;
  generatedImages: Array<{
    id: string;
    version: number;
    width: number;
    height: number;
  }>;
}

interface CoverCardProps {
  cover: CoverCardCover;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `há ${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `há ${diffDay}d`;
  if (diffDay < 30) return `há ${Math.floor(diffDay / 7)}sem`;
  return date.toLocaleDateString("pt-BR");
}

export default function CoverCard({ cover }: CoverCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const aspectClass = ASPECT_MAP[cover.format] ?? "aspect-[4/5]";
  const hasGeneratedImage = cover.generatedImages.length > 0;
  const hasBaseImage = !!cover.baseImageId;
  const hasImage = cover.status === "COMPLETED" && (hasGeneratedImage || hasBaseImage);
  const latestVersion = cover.generatedImages[0]?.version ?? 0;
  const thumbnailUrl = hasGeneratedImage
    ? `/api/covers/${cover.id}/image?v=${latestVersion}`
    : `/api/covers/${cover.id}/image?type=base`;

  async function handleDuplicate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDuplicating(true);
    try {
      const res = await fetch(`/api/covers/${cover.id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao duplicar");
      const data = await res.json();
      router.push(`/cover/${data.newCoverId}`);
    } catch {
      toast.error("Erro ao duplicar capa");
      setDuplicating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(true);
    try {
      const res = await fetch(`/api/covers/${cover.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao excluir");
      toast.success("Capa excluída");
      router.refresh();
    } catch {
      toast.error("Erro ao excluir capa");
      setDeleting(false);
    }
  }

  return (
    <Link
      href={`/cover/${cover.id}`}
      className="group block bg-background-elevated rounded-xl overflow-hidden border border-border hover:border-foreground/20 transition-all hover:shadow-[0_2px_12px_rgba(31,50,71,0.06)]"
    >
      {/* Thumbnail area */}
      <div className={`relative ${aspectClass} bg-background-subtle`}>
        {hasImage && !imageError ? (
          <img
            src={thumbnailUrl}
            alt={cover.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40 gap-2">
            <ImageIcon className="h-10 w-10" />
            <span className="text-xs">
              {imageError ? "Erro ao carregar" : hasImage ? "Carregando..." : "Sem imagem"}
            </span>
          </div>
        )}

        {/* Status badge */}
        <CoverStatusBadge status={cover.status as Status} size="sm" className="absolute top-2 left-2" />

        {/* Actions menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={() => router.push(`/cover/${cover.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={duplicating}>
                {duplicating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive focus:text-destructive"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3.5">
        <h3 className="font-medium text-sm text-foreground line-clamp-1 tracking-tight">
          {cover.title}
        </h3>
        <p className="text-xs text-foreground-soft mt-1" suppressHydrationWarning>
          {formatRelativeTime(cover.createdAt)} · {cover.contentType}
        </p>
      </div>
    </Link>
  );
}
