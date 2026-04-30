import { z } from "zod";

export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  fonts: z.object({
    primary: z.string(),
    italic: z.string(),
  }),

  positioning: z.object({
    preferredZones: z.array(z.string()),
    avoidZones: z.array(z.string()),
    safeMargin: z.object({
      top: z.number(),
      bottom: z.number(),
      left: z.number(),
      right: z.number(),
    }),
  }),
});

export type Theme = z.infer<typeof ThemeSchema>;
