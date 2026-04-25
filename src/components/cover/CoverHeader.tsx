import Link from "next/link";
import { CoverStatusBadge } from "./CoverStatusBadge";
import type { Status } from "@prisma/client";

interface CoverHeaderProps {
  title: string;
  status: string;
  createdAt: string;
}

export default function CoverHeader({
  title,
  status,
  createdAt,
}: CoverHeaderProps) {
  return (
    <div className="space-y-2">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-foreground-soft">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">
          {title}
        </span>
      </div>

      {/* Title + Status */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight break-words flex-1">{title}</h1>
        <CoverStatusBadge status={status as Status} />
      </div>

      <p className="text-xs text-foreground-soft">
        Criada em {new Date(createdAt).toLocaleString("pt-BR")}
      </p>
    </div>
  );
}
