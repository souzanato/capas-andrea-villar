"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Copy, Trash2, ChevronDown } from "lucide-react";
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

interface CoverVersion {
  version: number;
  width: number;
  height: number;
}

interface CoverToolbarProps {
  coverId: string;
  coverTitle: string;
  versions: CoverVersion[];
  currentVersion: number;
  onVersionChange: (version: number) => void;
  generatedPrompt: string | null;
}

export default function CoverToolbar({
  coverId,
  coverTitle,
  versions,
  currentVersion,
  onVersionChange,
  generatedPrompt,
}: CoverToolbarProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDownload() {
    try {
      const res = await fetch(`/api/covers/${coverId}/image?version=${currentVersion}`);
      if (!res.ok) throw new Error("Falha ao baixar");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const slug = coverTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      a.href = url;
      a.download = `${slug}-v${currentVersion}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao baixar imagem");
    }
  }

  async function handleCopyPrompt() {
    if (!generatedPrompt) return;
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      toast.success("Prompt copiado!");
    } catch {
      toast.error("Erro ao copiar prompt");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/covers/${coverId}`, { method: "DELETE" });
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

      {/* Download */}
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4" />
        Download
      </Button>

      {/* Copiar prompt */}
      {generatedPrompt && (
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
