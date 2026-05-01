import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  const appRole = (session?.user as { appRole?: string })?.appRole;

  if (appRole !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-semibold text-sm text-muted-foreground">
            Painel Admin
          </span>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin"
              className="text-foreground hover:text-primary transition-colors"
            >
              Resumo
            </Link>
            <Link
              href="/admin/requests"
              className="text-foreground hover:text-primary transition-colors"
            >
              Solicitações
            </Link>
            <Link
              href="/admin/users"
              className="text-foreground hover:text-primary transition-colors"
            >
              Usuários
            </Link>
          </nav>
          <div className="ml-auto">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Voltar ao app
            </Link>
          </div>
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
