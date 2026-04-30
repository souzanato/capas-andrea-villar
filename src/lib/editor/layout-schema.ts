import { z } from "zod";

// Cada linha tem texto e cor proprios.
// Outras propriedades (fonte, tamanho, peso, etc) sao do bloco inteiro.
export const TextLineSchema = z.object({
  text: z.string(),
  color: z.string(), // hex #FFFFFF
});

export const TextBlockSchema = z.object({
  id: z.string(),

  hidden: z.boolean().default(false),
  name: z.string().optional(),

  lines: z.array(TextLineSchema).min(1),

  position: z.object({
    x: z.number(),
    y: z.number(),
  }),

  rotation: z.number().default(0),

  width: z.number().optional(),
  align: z.enum(["left", "center", "right"]).default("left"),

  typography: z.object({
    fontFamily: z.string(),
    fontWeight: z.number(),
    fontSize: z.number(),
    italic: z.boolean().default(false),
    letterSpacing: z.number().default(0),
    lineHeight: z.number().default(1.1),
  }),

  effects: z.object({
    glow: z
      .object({
        enabled: z.boolean(),
        color: z.string(),
        blur: z.number(),
        opacity: z.number(),
      })
      .nullable(),
    shadow: z
      .object({
        enabled: z.boolean(),
        color: z.string(),
        blur: z.number(),
        offsetX: z.number(),
        offsetY: z.number(),
        opacity: z.number(),
      })
      .nullable(),
  }),

  zIndex: z.number().default(0),
});

export const CoverLayoutSchema = z.object({
  themeId: z.string(),
  canvasSize: z.object({
    width: z.number(),
    height: z.number(),
  }),

  textBlocks: z.array(TextBlockSchema),

  rationale: z.string(),
});

export type TextLine = z.infer<typeof TextLineSchema>;
export type TextBlock = z.infer<typeof TextBlockSchema>;
export type CoverLayout = z.infer<typeof CoverLayoutSchema>;
