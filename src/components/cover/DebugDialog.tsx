"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import type { CoverLayout } from "@/lib/editor/layout-schema";

interface DebugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: CoverLayout;
}

export default function DebugDialog({ open, onOpenChange, layout }: DebugDialogProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(layout, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4 pr-8">
            <span>Layout JSON (debug)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copiar
                </>
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-[60vh]">
          {json}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
