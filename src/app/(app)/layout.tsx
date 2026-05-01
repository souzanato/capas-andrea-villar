import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/brand/Logo";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { SignOutButton } from "@/components/SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const role = (session?.user as { appRole?: string })?.appRole;

  if (!session?.user) {
    redirect("/login");
  }

  if (role === "VIEWER") {
    redirect("/pending");
  }

  const pendingCount =
    role === "ADMIN"
      ? await db.profileRequest.count({ where: { status: "PENDING" } })
      : 0;

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

          {/* Lado direito: admin + usuário + sair */}
          <div className="flex items-center gap-4">
            {role === "ADMIN" && (
              <Link
                href="/admin/requests"
                className="relative text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-orange-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </Link>
            )}

            <span className="hidden sm:inline text-sm text-foreground-soft">
              {session.user.email}
            </span>

            <SignOutButton className="border border-border bg-background-elevated text-foreground hover:bg-background-subtle hover:border-foreground/30 transition-colors h-8 rounded-md px-3 text-xs">Sair</SignOutButton>
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
