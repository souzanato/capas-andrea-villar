import { z } from "zod";

export const FORMATS = ["REELS_9_16", "FEED_1_1", "CAROUSEL_4_5"] as const;
export const FORMAT_VALUES = [...FORMATS];
export const FORMAT_LABELS: Record<string, string> = {
  REELS_9_16: "9:16 — Reels/Stories",
  FEED_1_1: "1:1 — Feed quadrado",
  CAROUSEL_4_5: "4:5 — Carrossel",
};

export const CONTENT_TYPES = [
  "maternidade",
  "podcast",
  "motivacional",
  "educacional",
  "noticia",
  "vendas",
  "religioso",
  "esportes",
  "humor",
  "outro",
] as const;

export const PALETTES = ["andrea", "viral_classic", "custom"] as const;

export const PALETTE_SWATCHES: Record<string, string[]> = {
  andrea: ["#C8644D", "#1F4E8C", "#2D7A6E"],
  viral_classic: ["#FFE500", "#FFFFFF"],
  custom: [],
};

export const ACCENT_COLORS_ANDREA = [
  { hex: "#C8644D", label: "Emocional, acolhedor" },
  { hex: "#1F4E8C", label: "Calma, reflexão" },
  { hex: "#2D7A6E", label: "Esperança, equilíbrio" },
];

export const coverFormSchema = z.object({
  title: z
    .string()
    .min(3, "Mínimo de 3 caracteres")
    .max(100, "Máximo de 100 caracteres"),
  format: z.enum(FORMAT_VALUES),
  contentType: z.string().min(1, "Selecione um tipo de conteúdo"),
  customContentType: z.string().optional(),
  palette: z.string().min(1, "Selecione uma paleta"),
  customPalette: z.string().optional(),
  accentColor: z.string().optional(),
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
