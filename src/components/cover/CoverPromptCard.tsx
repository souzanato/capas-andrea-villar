"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

interface CoverPromptCardProps {
  prompt: string;
}

export default function CoverPromptCard({ prompt }: CoverPromptCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between p-4 text-left">
            <span className="text-sm font-semibold">Prompt gerado</span>
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator />
          <pre className="p-4 text-xs whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
            {prompt}
          </pre>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
