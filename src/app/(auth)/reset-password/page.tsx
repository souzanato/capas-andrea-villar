"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    const result = await resetPassword({
      token,
      newPassword: form.password,
    });

    if (result?.error) {
      setError("Link inválido ou já utilizado");
      setLoading(false);
      return;
    }

    router.push("/login?reset=true");
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-destructive">Link inválido ou expirado.</p>
        <Link href="/forgot-password" className="text-sm text-primary underline font-medium">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar nova senha</Label>
        <Input
          id="confirm"
          type="password"
          placeholder="Repita a senha"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "linear-gradient(rgb(250, 245, 242) 0%, rgb(240, 235, 230) 100%)" }}
    >
      <div className="w-full max-w-sm">
        <div
          className="bg-background-elevated rounded-xl p-8 border border-border"
          style={{ boxShadow: "rgba(31, 50, 71, 0.04) 0px 1px 0px, rgba(31, 50, 71, 0.04) 0px 4px 16px" }}
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-4">
              <Image
                src="/logo-andrea.png"
                alt="Andrea Villar"
                width={56}
                height={61}
                className="select-none"
              />
            </div>
            <h1 className="text-xl font-medium text-foreground tracking-tight">
              Capas <span className="text-foreground-soft font-normal">Andrea Villar</span>
            </h1>
            <p className="text-sm text-foreground-soft mt-1.5">Redefinir senha</p>
            <div
              className="mt-4 h-[3px] w-16 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent 0%, hsl(var(--andrea-rose)) 50%, transparent 100%)" }}
            />
          </div>

          <Suspense fallback={<p className="text-center text-sm text-foreground-soft">Carregando...</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-foreground-mute mt-6">
          Acesso restrito · Andrea Villar
        </p>
      </div>
    </div>
  );
}
