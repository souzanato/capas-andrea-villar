"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/LoadingOverlay";
import { Loader2 } from "lucide-react";

export function SignOutButton({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const { withLoading } = useLoading();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await withLoading(async () => {
      await authClient.signOut();
      router.push("/login");
    });
    setLoading(false);
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saindo...
        </span>
      ) : (
        children ?? "Sair"
      )}
    </button>
  );
}
