"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, LockKeyhole, Clock, XCircle } from "lucide-react";
import { useLoading } from "@/components/LoadingOverlay";

interface PendingClientProps {
  userName: string;
}

type RequestStatus = "none" | "pending" | "rejected" | "loading";

export default function PendingClient({ userName }: PendingClientProps) {
  const router = useRouter();
  const { withLoading } = useLoading();
  const [status, setStatus] = useState<RequestStatus>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Polling: quando a solicitação estiver pendente, verifica o appRole a cada 5s
  useEffect(() => {
    if (status !== "pending") return;

    const interval = setInterval(async () => {
      const session = await authClient.getSession();
      const appRole = (session?.data?.user as { appRole?: string })?.appRole;
      if (appRole === "CREATOR" || appRole === "ADMIN") {
        router.push("/dashboard");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, router]);

  async function checkApproval() {
    setChecking(true);
    setCheckMessage(null);
    try {
      const session = await authClient.getSession();
      const appRole = (session?.data?.user as { appRole?: string })?.appRole;
      if (appRole === "CREATOR" || appRole === "ADMIN") {
        router.push("/dashboard");
      } else {
        setCheckMessage("Ainda aguardando aprovação.");
      }
    } catch {
      setCheckMessage("Erro ao verificar. Tente novamente.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await withLoading(async () => {
      await authClient.signOut();
      router.push("/login");
    });
  }

  useEffect(() => {
    fetch("/api/profile-request")
      .then((r) => r.json())
      .then(({ request }) => {
        if (!request) setStatus("none");
        else if (request.status === "PENDING") setStatus("pending");
        else if (request.status === "REJECTED") setStatus("rejected");
        else setStatus("none");
      })
      .catch(() => setStatus("none"));
  }, []);

  async function handleRequest() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile-request", { method: "POST" });
      if (res.ok) setStatus("pending");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">

        {status === "loading" && (
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        )}

        {status === "none" && (
          <>
            <LockKeyhole className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Acesso restrito</h1>
              <p className="text-muted-foreground">
                Olá{userName ? `, ${userName}` : ""}! Sua conta foi confirmada mas ainda não tem
                permissão para criar capas.
              </p>
              <p className="text-muted-foreground">
                Solicite o perfil de criador(a) abaixo.
              </p>
            </div>
            <Button
              onClick={handleRequest}
              disabled={submitting}
              size="lg"
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Quero ser criador(a)"
              )}
            </Button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-muted-foreground underline disabled:opacity-50"
            >
              {signingOut ? "Saindo..." : "Sair da conta"}
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <Clock className="h-12 w-12 text-primary mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Solicitação enviada!</h1>
              <p className="text-muted-foreground">
                Sua solicitação foi recebida e está em análise. Você receberá
                um email quando for aprovada.
              </p>
            </div>
            <Button
              onClick={checkApproval}
              disabled={checking}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Já fui aprovado? Entrar"
              )}
            </Button>
            {checkMessage && (
              <p className="text-sm text-muted-foreground">{checkMessage}</p>
            )}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-muted-foreground underline disabled:opacity-50"
            >
              {signingOut ? "Saindo..." : "Sair da conta"}
            </button>
          </>
        )}

        {status === "rejected" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Solicitação não aprovada</h1>
              <p className="text-muted-foreground">
                Sua solicitação anterior não foi aprovada. Você pode enviar
                uma nova solicitação.
              </p>
            </div>
            <Button
              onClick={handleRequest}
              disabled={submitting}
              size="lg"
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Solicitar novamente"
              )}
            </Button>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm text-muted-foreground underline disabled:opacity-50"
            >
              {signingOut ? "Saindo..." : "Sair da conta"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}
