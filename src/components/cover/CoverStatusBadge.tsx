import { Status } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CoverStatusBadgeProps {
  status: Status;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<Status, {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  pulse: boolean;
}> = {
  PENDING: {
    label: "Aguardando",
    bgClass: "bg-background-subtle",
    textClass: "text-foreground-soft",
    borderClass: "border-border",
    dotClass: "bg-foreground-mute",
    pulse: false,
  },
  GENERATING_PROMPT: {
    label: "Gerando prompt",
    bgClass: "bg-andrea-blue-bg",
    textClass: "text-andrea-blue-foreground",
    borderClass: "border-andrea-blue/40",
    dotClass: "bg-andrea-blue",
    pulse: true,
  },
  GENERATING_IMAGE: {
    label: "Gerando imagem",
    bgClass: "bg-andrea-rose-bg",
    textClass: "text-andrea-rose-foreground",
    borderClass: "border-andrea-rose/40",
    dotClass: "bg-andrea-rose",
    pulse: true,
  },
  COMPLETED: {
    label: "Pronta",
    bgClass: "bg-andrea-green-bg",
    textClass: "text-andrea-green-foreground",
    borderClass: "border-andrea-green/40",
    dotClass: "bg-andrea-green",
    pulse: false,
  },
  FAILED: {
    label: "Falhou",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/30",
    dotClass: "bg-destructive",
    pulse: false,
  },
};

export function CoverStatusBadge({
  status,
  size = "md",
  showDot = true,
  className,
}: CoverStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  const sizeClasses = size === "sm"
    ? "text-[11px] px-2 py-0.5 gap-1.5"
    : "text-xs px-2.5 py-1 gap-2";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium leading-none",
        sizeClasses,
        config.bgClass,
        config.textClass,
        config.borderClass,
        className,
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            config.dotClass,
            config.pulse && "animate-pulse",
          )}
          aria-hidden
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
