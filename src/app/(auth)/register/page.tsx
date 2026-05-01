"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("As senhas não coincidem");
      return;
    }

    if (form.password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setLoading(true);

    const result = await signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (result?.error) {
      if (result.error.status === 422) {
        setError("Email já cadastrado");
      } else {
        setError(result.error.message ?? "Erro ao criar conta");
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
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
            <p className="text-sm text-foreground-soft mt-1.5">Criar nova conta</p>
            <div
              className="mt-4 h-[3px] w-16 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent 0%, hsl(var(--andrea-rose)) 50%, transparent 100%)" }}
            />
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <Mail className="h-12 w-12 text-primary mx-auto" />
              <p className="text-sm text-foreground">
                Enviamos um link de confirmação para{" "}
                <strong>{form.email}</strong>.
              </p>
              <p className="text-xs text-foreground-soft">
                Clique no link para ativar sua conta.
              </p>
              <Link href="/login" className="text-sm text-primary underline font-medium">
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
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
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repita a senha"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-foreground-soft">
                  Já tem conta?{" "}
                  <Link href="/login" className="text-primary underline font-medium">
                    Entrar
                  </Link>
                </p>
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
