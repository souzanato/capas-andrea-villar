import { useState, useEffect, useRef, useCallback } from "react";
import type { CoverLayout } from "@/lib/editor/layout-schema";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface UseSaveLayoutOptions {
  coverId: string;
  layout: CoverLayout;
  debounceMs?: number;
}

export function useSaveLayout({ coverId, layout, debounceMs = 2000 }: UseSaveLayoutOptions) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutRef = useRef(layout);
  const isFirstRender = useRef(true);

  // Função de save real
  const save = useCallback(
    async (layoutToSave: CoverLayout) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/covers/${coverId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ layoutJson: layoutToSave }),
        });
        if (!res.ok) throw new Error("Save failed");
        setStatus("saved");
        // Volta pra idle depois de 3 segundos
        setTimeout(() => setStatus("idle"), 3000);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 4000);
      }
    },
    [coverId]
  );

  // Salvar manualmente (chamado pelo botão)
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    save(layoutRef.current);
  }, [save]);

  // Auto-save com debounce quando layout muda
  useEffect(() => {
    layoutRef.current = layout;

    // Ignora o primeiro render (layout inicial carregado do banco)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setStatus("pending");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      save(layout);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [layout, debounceMs, save]);

  return { status, saveNow };
}
