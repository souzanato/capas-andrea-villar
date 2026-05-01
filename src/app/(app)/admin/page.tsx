import { db } from "@/lib/db";
import Link from "next/link";

export default async function AdminPage() {
  const [totalUsers, byRole, pendingRequests] = await Promise.all([
    db.user.count(),
    db.user.groupBy({ by: ["role"], _count: { role: true } }),
    db.profileRequest.count({ where: { status: "PENDING" } }),
  ]);

  const roleCount = Object.fromEntries(
    byRole.map((r) => [r.role, r._count.role])
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Painel Admin</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total de usuários", value: totalUsers, href: "/admin/users" },
          { label: "Criadores", value: roleCount.CREATOR ?? 0, href: "/admin/users?role=CREATOR" },
          { label: "Aguardando", value: roleCount.VIEWER ?? 0, href: "/admin/users?role=VIEWER" },
          {
            label: "Solicitações pendentes",
            value: pendingRequests,
            href: "/admin/requests",
            highlight: pendingRequests > 0,
          },
        ].map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border p-5 space-y-1 hover:border-primary transition-colors ${
              card.highlight ? "border-orange-400 bg-orange-50 dark:bg-orange-950" : "bg-card"
            }`}
          >
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
