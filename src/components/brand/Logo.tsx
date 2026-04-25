import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textVariant?: "full" | "short";
}

/**
 * Logo da marca Andrea Villar.
 *
 * Variantes:
 * - showText=false → apenas a marca visual (ícone)
 * - showText=true, textVariant="full" → ícone + "Capas Andrea Villar"
 * - showText=true, textVariant="short" → ícone + "Capas — Andrea"
 */
export function Logo({
  size = 32,
  className,
  showText = false,
  textVariant = "full",
}: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/logo-andrea.png"
        alt="Andrea Villar"
        width={size}
        height={Math.round(size * 1114 / 1024)}
        priority
        className="select-none"
      />
      {showText && (
        <span className="font-medium text-foreground tracking-tight leading-none">
          {textVariant === "full" ? (
            <>
              <span>Capas</span>
              <span className="text-foreground-soft font-normal"> Andrea Villar</span>
            </>
          ) : (
            <>
              <span>Capas</span>
              <span className="text-foreground-soft font-normal"> — Andrea</span>
            </>
          )}
        </span>
      )}
    </div>
  );
}
