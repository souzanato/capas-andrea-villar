"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CoverInputsCardProps {
  title: string;
  format: string;
  accentColor: string | null;
  baseImage: {
    id: string;
    width: number;
    height: number;
    mimeType: string;
  } | null;
}

const FORMAT_LABELS: Record<string, string> = {
  REELS_9_16: "9:16 — Reels/Stories",
  FEED_1_1: "1:1 — Feed quadrado",
  CAROUSEL_4_5: "4:5 — Carrossel",
};

export default function CoverInputsCard({
  title,
  format,
  accentColor,
  baseImage,
}: CoverInputsCardProps) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-4 text-left">
            <span className="text-sm font-semibold">Inputs</span>
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Título</span>
              <span className="font-medium text-right max-w-[60%]">{title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Formato</span>
              <span className="font-medium">
                {FORMAT_LABELS[format] ?? format}
              </span>
            </div>
            {accentColor && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Destaque</span>
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className="h-3 w-3 rounded-full border"
                    style={{ backgroundColor: accentColor }}
                  />
                  {accentColor}
                </span>
              </div>
            )}

            {baseImage && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Imagem base</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                        <Maximize2 className="h-3 w-3" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <div className="flex items-center justify-center p-4">
                        <img
                          src={`/api/covers/${baseImage.id}/image?type=base`}
                          alt="Imagem base"
                          className="max-h-[70vh] rounded-lg object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xs text-muted-foreground">
                  {baseImage.width}×{baseImage.height}
                </p>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
