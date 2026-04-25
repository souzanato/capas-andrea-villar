import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/brand/Logo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-background-elevated">
        <div className="container mx-auto flex items-center justify-between h-16 px-6">
          {/* Lado esquerdo: Logo + nome */}
          <Link
            href="/dashboard"
            className="group inline-flex items-center hover:opacity-80 transition-opacity"
            aria-label="Capas Andrea Villar - voltar ao dashboard"
          >
            <Logo size={32} showText textVariant="full" />
          </Link>

          {/* Lado direito: usuário + sair */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm text-foreground-soft">
              {session.user.email}
            </span>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="border-border text-foreground hover:bg-background-subtle hover:text-foreground"
              >
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-10">{children}</main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "border-border bg-background-elevated text-foreground",
            description: "text-foreground-soft",
          },
        }}
      />
    </div>
  );
}
