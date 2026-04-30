import { z } from "zod";

export const FORMATS = ["REELS_9_16", "FEED_1_1", "CAROUSEL_4_5"] as const;
export const FORMAT_VALUES = [...FORMATS];
export const FORMAT_LABELS: Record<string, string> = {
  REELS_9_16: "9:16 — Reels/Stories",
  FEED_1_1: "1:1 — Feed quadrado",
  CAROUSEL_4_5: "4:5 — Carrossel",
};

export const ACCENT_COLORS_ANDREA = [
  { hex: "#C8644D" },
  { hex: "#1F4E8C" },
  { hex: "#2D7A6E" },
  { hex: "#8B3F9E" },
];

export const coverFormSchema = z.object({
  title: z
    .string()
    .min(3, "Mínimo de 3 caracteres")
    .max(100, "Máximo de 100 caracteres"),
  format: z.enum(FORMAT_VALUES),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida")
    .min(1, "Selecione uma cor de destaque"),
});

export type CoverFormData = z.infer<typeof coverFormSchema>;

const MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateImage(file: File): string | null {
  if (!MIME_TYPES.includes(file.type)) {
    return "Formato não aceito. Use JPEG, PNG ou WebP.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "Arquivo muito grande. Máximo 10MB.";
  }
  return null;
}
