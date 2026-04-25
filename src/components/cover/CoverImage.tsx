import { cn } from "@/lib/utils";

const ASPECT_MAP: Record<string, string> = {
  REELS_9_16: "aspect-[9/16]",
  FEED_1_1: "aspect-square",
  CAROUSEL_4_5: "aspect-[4/5]",
};

interface CoverImageProps {
  src: string;
  alt: string;
  format: string;
  width?: number;
  height?: number;
}

export default function CoverImage({
  src,
  alt,
  format,
  width,
  height,
}: CoverImageProps) {
  const aspectClass = ASPECT_MAP[format] ?? "aspect-[4/5]";

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div
        className={cn(
          "relative rounded-lg overflow-hidden shadow-2xl bg-gradient-to-b from-muted to-muted/50",
          aspectClass
        )}
      >
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      {width && height && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          {width}×{height}
        </p>
      )}
    </div>
  );
}
