"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/LoadingOverlay";
import {
  Undo2,
  Redo2,
  Download,
  Copy,
  Trash2,
  ChevronDown,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type Konva from "konva";

interface CoverVersion {
  version: number;
  width: number;
  height: number;
}

interface CoverToolbarProps {
  cover: {
    id: string;
    title: string;
    generatedPrompt: string | null;
  };
  versions: CoverVersion[];
  currentVersion: number;
  onVersionChange: (version: number) => void;
  isProcessing?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  stageRef: React.RefObject<Konva.Stage | null>;
  onSave?: () => void;
  showSafeZone?: boolean;
  onToggleSafeZone?: () => void;
}

/** Converte uma data URL (base64) em Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const mime = parts[0]?.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/** Verifica se o navegador suporta Web Share API com compartilhamento de arquivos */
function canShareFile(blob: Blob, filename: string): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.canShare) return false;
  const file = new File([blob], filename, { type: "image/png" });
  return navigator.canShare({ files: [file] });
}

export default function CoverToolbar({
  cover,
  versions,
  currentVersion,
  onVersionChange,
  isProcessing = false,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  stageRef,
  onSave,
  showSafeZone = false,
  onToggleSafeZone,
}: CoverToolbarProps) {
  const router = useRouter();
  const { withLoading } = useLoading();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleExport() {
    const stage = stageRef.current;
    if (!stage) return;

    await withLoading(async () => {
      try {
        // 1. Esconde o Transformer antes de exportar
        const transformer = stage.findOne("Transformer");
        if (transformer) transformer.hide();
        stage.draw();

        // 2. Gera PNG do canvas
        const dataUrl = stage.toDataURL({ pixelRatio: 2 });

        // Restaura o Transformer
        if (transformer) transformer.show();
        stage.draw();

        // 2. Salva no banco
        const res = await fetch(`/api/covers/${cover.id}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl }),
        });

        if (!res.ok) throw new Error("Erro ao salvar");

        // Salva layoutJson também
        onSave?.();

        // 4. Dispara download no browser
        // Converte data URL para Blob (mais confiável que data URL,
        // especialmente em mobile onde data URLs sofrem restrições)
        const blob = dataUrlToBlob(dataUrl);
        const url = URL.createObjectURL(blob);
        const filename = `capa-${cover.id}-v${Date.now()}.png`;

        // Tenta Web Share API primeiro (melhor UX no iOS —
        // mostra a share sheet nativa com opção "Salvar imagem")
        if (canShareFile(blob, filename)) {
          try {
            await navigator.share({
              files: [new File([blob], filename, { type: "image/png" })],
              title: "Capa exportada",
            });
            toast.success("Exportado! Imagem salva no dispositivo.");
            URL.revokeObjectURL(url);
            router.refresh();
            return;
          } catch {
            // Usuário cancelou ou share falhou — tenta fallback
          }
        }

        // Fallback: anchor click com Blob URL (funciona em desktop e Android)
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Libera a blob URL após uso
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        toast.success("Exportado! Imagem salva e baixada.");
        router.refresh();
      } catch (err) {
        console.error(err);
        toast.error("Erro ao exportar");
      }
    });
  }

  async function handleCopyPrompt() {
    if (!cover.generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(cover.generatedPrompt);
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Erro ao copiar prompt");
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/covers/${cover.id}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao regenerar");
      }
      toast.success("Regenerando capa...");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao regenerar capa"
      );
      setRegenerating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/covers/${cover.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir");
      toast.success("Capa excluída");
      router.push("/dashboard");
    } catch {
      toast.error("Erro ao excluir capa");
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="outline"
          size="sm"
          disabled={!canUndo}
          onClick={onUndo}
          title="Desfazer (Cmd+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canRedo}
          onClick={onRedo}
          title="Refazer (Cmd+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Versão */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            Versão {currentVersion}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {versions.map((v) => (
            <DropdownMenuItem
              key={v.version}
              onClick={() => onVersionChange(v.version)}
              disabled={v.version === currentVersion}
            >
              Versão {v.version} — {v.width}×{v.height}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Safe zone */}
      {onToggleSafeZone && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={onToggleSafeZone}
          title={showSafeZone ? "Esconder área de segurança" : "Mostrar área de segurança"}
        >
          {showSafeZone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showSafeZone ? "Safe zone" : "Safe zone"}
        </Button>
      )}

      {/* Exportar PNG */}
      <Button
        variant="default"
        size="sm"
        className="gap-1"
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
        Exportar PNG
      </Button>

      {/* Copiar prompt */}
      {cover.generatedPrompt && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleCopyPrompt}
        >
          <Copy className="h-4 w-4" />
          Copiar prompt
        </Button>
      )}

      {/* Regenerar */}
      <Button
        variant="default"
        size="sm"
        className="gap-1"
        onClick={handleRegenerate}
        disabled={regenerating || isProcessing}
      >
        <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
        {regenerating ? "Regenerando..." : "Gerar novamente"}
      </Button>

      {/* Excluir */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 text-destructive">
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir capa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta capa? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
