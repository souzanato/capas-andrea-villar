"use client";

import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BaseImageModalProps {
  thumbnailSrc: string;
}

export default function BaseImageModal({
  thumbnailSrc,
}: BaseImageModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
          <Maximize2 className="h-3 w-3" />
          Ver imagem base
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="flex items-center justify-center p-4">
          <img
            src={thumbnailSrc}
            alt="Imagem base"
            className="max-h-[70vh] rounded-lg object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
