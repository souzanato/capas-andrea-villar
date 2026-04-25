"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface CoverStatusPollerProps {
  coverId: string;
  initialStatus: string;
}

const POLL_INTERVAL = 3000; // 3 segundos

export default function CoverStatusPoller({
  coverId,
  initialStatus,
}: CoverStatusPollerProps) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Só faz polling se ainda estiver processando
    if (initialStatus === "COMPLETED" || initialStatus === "FAILED") return;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/covers/${coverId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "COMPLETED" || data.status === "FAILED") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          router.refresh();
        }
      } catch {
        // ignora erros de rede durante polling
      }
    }, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [coverId, initialStatus, router]);

  return null;
}
