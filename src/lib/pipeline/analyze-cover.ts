import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";
import { CoverLayoutSchema, type CoverLayout } from "@/lib/editor/layout-schema";
import { loadTheme } from "@/lib/themes/load";
import type { Theme } from "@/lib/themes/types";
import { enter, exit, log, error as logError } from "./debug-logger";

const FORMAT_DIMENSIONS = {
  REELS_9_16: { width: 1080, height: 1920 },
  FEED_1_1: { width: 1080, height: 1080 },
  CAROUSEL_4_5: { width: 1080, height: 1350 },
} as const;

const FORMAT_DESC = {
  REELS_9_16: "9:16 vertical Instagram Reels",
  FEED_1_1: "1:1 square Instagram feed",
  CAROUSEL_4_5: "4:5 portrait Instagram carousel",
};

const ACCENT_NAMES: Record<string, string> = {
  "#C8644D": "warm terracotta red",
  "#1F4E8C": "rich blue",
  "#2D7A6E": "deep sage green",
};

interface AnalyzeInput {
  title: string;
  accentHex: string;
  format: keyof typeof FORMAT_DIMENSIONS;
  themeId: string;
  baseImageBase64: string;
  baseImageMimeType: string;
}

let cachedPromptTemplate: string | null = null;

async function loadPromptTemplate(): Promise<string> {
  if (cachedPromptTemplate) return cachedPromptTemplate;
  const promptPath = path.join(process.cwd(), "prompts", "analyze-cover-v1.md");
  cachedPromptTemplate = await readFile(promptPath, "utf-8");
  return cachedPromptTemplate;
}

function buildPrompt(
  template: string,
  input: AnalyzeInput,
  theme: Theme,
  canvas: { width: number; height: number }
): string {
  const accentName = ACCENT_NAMES[input.accentHex.toUpperCase()] ?? "the brand accent color";

  return template
    .replaceAll("[TITLE]", input.title)
    .replaceAll("[ACCENT_NAME]", accentName)
    .replaceAll("[ACCENT_HEX]", input.accentHex)
    .replaceAll("[FORMAT_DESC]", FORMAT_DESC[input.format])
    .replaceAll("[CANVAS_WIDTH]", String(canvas.width))
    .replaceAll("[CANVAS_HEIGHT]", String(canvas.height))
    .replaceAll("[CANVAS_WIDTH_85_PERCENT]", String(Math.round(canvas.width * 0.85)))
    .replaceAll("[THEME_NAME]", theme.name)
    .replaceAll("[THEME_DESCRIPTION]", theme.description)
    .replaceAll("[THEME_ID]", theme.id)
    .replaceAll("[THEME_FONT_PRIMARY]", theme.fonts.primary)
    .replaceAll("[THEME_FONT_ITALIC]", theme.fonts.italic)
    .replaceAll("[MARGIN_TOP]", String(theme.positioning.safeMargin.top))
    .replaceAll("[MARGIN_BOTTOM]", String(theme.positioning.safeMargin.bottom))
    .replaceAll("[MARGIN_LEFT]", String(theme.positioning.safeMargin.left))
    .replaceAll("[MARGIN_RIGHT]", String(theme.positioning.safeMargin.right));
}

export async function analyzeCover(input: AnalyzeInput): Promise<CoverLayout> {
  const fn = "analyzeCover";
  await enter(fn, { title: input.title, format: input.format, themeId: input.themeId });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await logError(fn, "OPENAI_API_KEY not configured");
    throw new Error("OPENAI_API_KEY nao configurada.");
  }

  const theme = await loadTheme(input.themeId);
  const canvas = FORMAT_DIMENSIONS[input.format];
  const template = await loadPromptTemplate();
  const prompt = buildPrompt(template, input, theme, canvas);

  await log(fn, "log", { phase: "prompt_ready", promptLength: prompt.length });

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${input.baseImageMimeType};base64,${input.baseImageBase64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("GPT-4o nao retornou conteudo na resposta.");
  }

  await log(fn, "http_response", { contentLength: content.length });

  const parsed = JSON.parse(content);
  const validated = CoverLayoutSchema.parse(parsed);

  await exit(fn, { textBlocksCount: validated.textBlocks.length });

  return validated;
}
