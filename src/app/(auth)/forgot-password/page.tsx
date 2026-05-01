"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forget-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "/reset-password" }),
    });
    setLoading(false);
    setSent(true);
  }

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
            <p className="text-sm text-foreground-soft mt-1.5">Esqueci minha senha</p>
            <div
              className="mt-4 h-[3px] w-16 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent 0%, hsl(var(--andrea-rose)) 50%, transparent 100%)" }}
            />
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <MailCheck className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-foreground">
                Se o email <strong>{email}</strong> estiver cadastrado, você
                receberá um link para redefinir sua senha.
              </p>
              <Link href="/login" className="text-sm text-primary underline font-medium">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-primary underline font-medium">
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-foreground-mute mt-6">
          Acesso restrito · Andrea Villar
        </p>
      </div>
    </div>
  );
}
