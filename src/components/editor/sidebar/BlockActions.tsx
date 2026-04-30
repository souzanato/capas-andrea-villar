"use client";

import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";

interface Props {
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export default function BlockActions({ onDuplicate, onDelete, canDelete }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={onDuplicate}
        title="Duplicar bloco"
      >
        <Copy className="h-3 w-3 mr-1" />
        Duplicar
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
        onClick={onDelete}
        disabled={!canDelete}
        title={canDelete ? "Deletar bloco" : "Não pode deletar — é o último bloco"}
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Deletar
      </Button>
    </div>
  );
}
