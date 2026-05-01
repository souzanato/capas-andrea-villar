"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Logo } from "@/components/brand/Logo";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginData = z.infer<typeof loginSchema>;

function LoginBanner() {
  const searchParams = useSearchParams();
  const reset = searchParams.get("reset");

  if (reset === "true") {
    return (
      <div
        className="px-3 py-2 rounded-md text-sm text-center"
        style={{
          background: "#E8F5E9",
          color: "#2E7D32",
          border: "0.5px solid #A5D6A7",
        }}
      >
        Senha redefinida com sucesso!
      </div>
    );
  }

  return null;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginData) {
    const result = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      if (result.error.status === 403) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("error", "email_not_verified");
        router.replace(`/login?${params.toString()}`);
      } else {
        const params = new URLSearchParams(searchParams.toString());
        params.set("error", "invalid_credentials");
        router.replace(`/login?${params.toString()}`);
      }
      return;
    }

    router.push("/dashboard");
  }

  const urlError = searchParams.get("error");

  async function handleGoogleSignIn() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  }

  return (
    <>
      <LoginBanner />

      {urlError === "email_not_verified" && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 text-center mb-4">
          Seu email ainda não foi confirmado.{" "}
          <Link href="/resend-confirmation" className="underline font-medium">
            Reenviar link de confirmação
          </Link>
        </div>
      )}

      {urlError === "invalid_credentials" && (
        <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-3 text-center mb-4">
          Email ou senha inválidos
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground text-sm font-medium">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="bg-white border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground text-sm font-medium">
                  Senha
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Sua senha"
                    className="bg-white border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-foreground-soft hover:text-primary transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Form>

      {/* Separador */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background-elevated px-2 text-foreground-soft">
            ou continue com
          </span>
        </div>
      </div>

      {/* Botão Google */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Entrar com Google
      </Button>

      <div className="mt-6 text-center">
        <p className="text-sm text-foreground-soft">
          Não tem conta?{" "}
          <Link href="/register" className="text-primary underline font-medium">
            Criar conta
          </Link>
        </p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: "linear-gradient(180deg, #FAF5F2 0%, #F0EBE6 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Card do login */}
        <div
          className="bg-background-elevated rounded-xl p-8 border border-border"
          style={{
            boxShadow: "0 1px 0 rgba(31, 50, 71, 0.04), 0 4px 16px rgba(31, 50, 71, 0.04)",
          }}
        >
          {/* Cabeçalho com logo */}
          <div className="flex flex-col items-center mb-8">
            <Logo size={56} className="mb-4" />
            <h1 className="text-xl font-medium text-foreground tracking-tight">
              Capas <span className="text-foreground-soft font-normal">Andrea Villar</span>
            </h1>
            <p className="text-sm text-foreground-soft mt-1.5">
              Capas que impulsionam
            </p>
            {/* Linha decorativa rosa-quartzo */}
            <div
              className="mt-4 h-[3px] w-16 rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent 0%, hsl(var(--andrea-rose)) 50%, transparent 100%)",
              }}
              aria-hidden
            />
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Rodapé sutil */}
        <p className="text-center text-xs text-foreground-mute mt-6">
          Acesso restrito · Andrea Villar
        </p>
      </div>
    </div>
  );
}
