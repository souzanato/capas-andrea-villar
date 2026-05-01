"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/LoadingOverlay";

interface Request {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
  };
}

export default function RequestsClient({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const { withLoading } = useLoading();
  const [loading, setLoading] = useState<string | null>(null);
  const [processed, setProcessed] = useState<Record<string, boolean>>({});

  async function handle(id: string, action: "approve" | "reject") {
    setLoading(id);
    await withLoading(async () => {
      await fetch(`/api/admin/requests/${id}/${action}`, { method: "POST" });
      setProcessed((prev) => ({ ...prev, [id]: true }));
      router.refresh();
    });
    setLoading(null);
  }

  const visible = requests.filter((r) => !processed[r.id]);

  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p>Nenhuma solicitação pendente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((req) => (
        <div
          key={req.id}
          className="flex items-center justify-between rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            {req.user.image ? (
              <img
                src={req.user.image}
                alt={req.user.name ?? ""}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {(req.user.name ?? req.user.email)[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-sm">{req.user.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{req.user.email}</p>
              <p className="text-xs text-muted-foreground">
                Solicitado em{" "}
                {new Date(req.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => handle(req.id, "reject")}
              disabled={loading === req.id}
            >
              {loading === req.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Rejeitar</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handle(req.id, "approve")}
              disabled={loading === req.id}
            >
              {loading === req.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Aprovar</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
