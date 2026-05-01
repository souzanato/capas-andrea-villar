"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink } from "lucide-react";
import { useLoading } from "@/components/LoadingOverlay";
import Link from "next/link";

const ROLE_LABELS: Record<string, string> = {
  VIEWER: "Aguardando",
  CREATOR: "Criador(a)",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  VIEWER: "bg-yellow-100 text-yellow-800",
  CREATOR: "bg-green-100 text-green-800",
  ADMIN: "bg-blue-100 text-blue-800",
};

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  _count: { covers: number };
}

export default function UsersClient({
  users,
  currentRole,
}: {
  users: User[];
  currentRole?: string;
}) {
  const router = useRouter();
  const { withLoading } = useLoading();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function changeRole(userId: string, role: string) {
    setLoadingId(userId);
    await withLoading(async () => {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.refresh();
    });
    setLoadingId(null);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentRole) params.set("role", currentRole);
    router.push(`/admin/users?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-64"
          />
          <Button type="submit" variant="outline" size="sm">Buscar</Button>
        </form>

        <div className="flex gap-1">
          {["", "VIEWER", "CREATOR", "ADMIN"].map((role) => (
            <button
              key={role}
              onClick={() =>
                router.push(role ? `/admin/users?role=${role}` : "/admin/users")
              }
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                currentRole === role || (!currentRole && !role)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              {role ? ROLE_LABELS[role] : "Todos"}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-xl border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name ?? ""}
                  className="h-9 w-9 rounded-full"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {(user.name ?? user.email)[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{user.name ?? "—"}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                  {!user.emailVerified && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Email não confirmado
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user._count.covers} capa{user._count.covers !== 1 ? "s" : ""} ·{" "}
                  desde {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </p>
                {user.role === "CREATOR" && (
                  <Link
                    href={`/dashboard?creatorId=${user.id}`}
                    className="text-xs text-primary underline inline-flex items-center gap-0.5"
                  >
                    Ver capas <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Ações de role */}
            <div className="flex gap-1">
              {user.role !== "VIEWER" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => changeRole(user.id, "VIEWER")}
                  disabled={loadingId === user.id}
                  className="text-xs"
                >
                  {loadingId === user.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Revogar"
                  )}
                </Button>
              )}
              {user.role === "VIEWER" && (
                <Button
                  size="sm"
                  onClick={() => changeRole(user.id, "CREATOR")}
                  disabled={loadingId === user.id}
                  className="text-xs"
                >
                  {loadingId === user.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Aprovar"
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
