"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginData) {
    setError(null);

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha inválidos");
      return;
    }

    router.push("/dashboard");
  }

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

          {/* Formulário */}
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

              {error && (
                <div
                  className="px-3 py-2 rounded-md text-sm text-center"
                  style={{
                    background: "hsl(var(--andrea-rose-bg))",
                    color: "hsl(var(--andrea-rose-fg))",
                    border: "0.5px solid hsl(var(--andrea-rose) / 0.3)",
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Rodapé sutil */}
        <p className="text-center text-xs text-foreground-mute mt-6">
          Acesso restrito · Andrea Villar
        </p>
      </div>
    </div>
  );
}
