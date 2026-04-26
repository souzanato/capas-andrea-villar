import sharp from "sharp";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { readFile } from "fs/promises";
import path from "path";
import { enter, exit, log, error as logError } from "./debug-logger";

// ── Dimensões finais por formato ─────────────────

export const FORMAT_DIMENSIONS = {
  REELS_9_16: { width: 1080, height: 1920 },
  FEED_1_1: { width: 1080, height: 1080 },
  CAROUSEL_4_5: { width: 1080, height: 1350 },
} as const;

// ── Tamanho aceito pela OpenAI Images por formato ──

const OPENAI_SIZE_BY_FORMAT = {
  REELS_9_16: "1024x1536" as const,
  FEED_1_1: "1024x1024" as const,
  CAROUSEL_4_5: "1024x1536" as const,
};

// ── Descrição de formato pra injetar no prompt ─────

const FORMAT_DESC_BY_FORMAT = {
  REELS_9_16: "9:16 vertical Instagram/Reels",
  FEED_1_1: "1:1 square Instagram feed",
  CAROUSEL_4_5: "4:5 portrait Instagram carousel",
};

// ── Mapeamento hex → nome de cor descritivo ────────
//
// Pra o GPT-Image entender melhor o tom desejado, passamos
// um descritor visual ANTES do hex, em vez de só o hex.

const ACCENT_COLOR_NAMES: Record<string, string> = {
  "#C8644D": "warm terracotta red",
  "#1F4E8C": "rich blue",
  "#2D7A6E": "deep sage green",
};

function resolveAccentName(hex: string | null | undefined): string {
  if (!hex) return "rich blue";
  const upper = hex.toUpperCase();
  return ACCENT_COLOR_NAMES[upper] ?? "the brand accent color";
}

// ── Tipos ──────────────────────────────────────────

export interface ImageGenerationInput {
  title: string;
  accentColor: string | null;
  format: "REELS_9_16" | "FEED_1_1" | "CAROUSEL_4_5";
  baseImageBase64: string;
  baseImageMimeType: string;
}

export interface GeneratedImageResult {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
  promptUsed: string;
}

// ── Carrega o template de prompt do disco (com cache) ──

let cachedPromptTemplate: string | null = null;

async function loadPromptTemplate(): Promise<string> {
  if (cachedPromptTemplate) return cachedPromptTemplate;

  const promptPath = path.join(process.cwd(), "prompts", "cover-prompt-v1.md");
  const content = await readFile(promptPath, "utf-8");
  cachedPromptTemplate = content;
  return content;
}

function buildPrompt(
  template: string,
  title: string,
  accentHex: string,
  format: keyof typeof FORMAT_DESC_BY_FORMAT
): string {
  const accentName = resolveAccentName(accentHex);
  const formatDesc = FORMAT_DESC_BY_FORMAT[format];

  return template
    .replaceAll("[TITLE]", title)
    .replaceAll("[ACCENT_NAME]", accentName)
    .replaceAll("[ACCENT_HEX]", accentHex)
    .replaceAll("[FORMAT_DESC]", formatDesc);
}

// ── Função principal ───────────────────────────────

/**
 * Gera a imagem final da capa diretamente via GPT-Image-1.5,
 * sem etapa intermediária de GPT-4o.
 *
 * O prompt vem do template fixo em prompts/cover-prompt-v1.md,
 * com [TITLE], [ACCENT_NAME], [ACCENT_HEX] e [FORMAT_DESC] substituídos.
 */
export async function generateImageFromPrompt(
  input: ImageGenerationInput
): Promise<GeneratedImageResult> {
  const fn = "generateImageFromPrompt";
  await enter(fn, {
    title: input.title,
    accentColor: input.accentColor,
    format: input.format,
    baseImageSize: input.baseImageBase64.length,
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await logError(fn, "OPENAI_API_KEY not configured");
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  // ── 1. Monta o prompt ────────────────────────────

  const template = await loadPromptTemplate();
  const accentHex = input.accentColor ?? "#1F4E8C";
  const finalPrompt = buildPrompt(template, input.title, accentHex, input.format);

  await log(fn, "log", { phase: "prompt_ready", promptLength: finalPrompt.length });

  // ── 2. Prepara imagem base como PNG ──────────────

  const baseBuffer = Buffer.from(input.baseImageBase64, "base64");
  const pngBuffer = await sharp(baseBuffer)
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  await log(fn, "log", {
    phase: "image_ready",
    originalSize: baseBuffer.length,
    pngSize: pngBuffer.length,
  });

  // ── 3. Chama OpenAI Images Edit ──────────────────

  const openai = new OpenAI({ apiKey });
  const targetDimensions = FORMAT_DIMENSIONS[input.format];
  const openaiSize = OPENAI_SIZE_BY_FORMAT[input.format];
  const OPENAI_TIMEOUT_MS = 120_000;

  await log(fn, "http_request", {
    model: "gpt-image-1.5",
    promptLength: finalPrompt.length,
    size: openaiSize,
    quality: "low",
    input_fidelity: "high",
  });

  const imageFile = await toFile(pngBuffer, "base.png", { type: "image/png" });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const openaiPromise = openai.images.edit({
    model: "gpt-image-1.5",
    image: imageFile,
    prompt: finalPrompt,
    size: openaiSize,
    quality: "high",
    input_fidelity: "high",
    n: 1,
  } as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`OpenAI Images request timed out after ${OPENAI_TIMEOUT_MS / 1000}s`)),
      OPENAI_TIMEOUT_MS
    );
  });

  const response = await Promise.race([openaiPromise, timeoutPromise]);

  await log(fn, "http_response", {
    hasData: !!response.data?.length,
    dataCount: response.data?.length ?? 0,
  });

  const imageData = response.data?.[0];
  if (!imageData?.b64_json) {
    await logError(fn, "No image in OpenAI response", {
      response: JSON.stringify(response).substring(0, 500),
    });
    throw new Error(
      "OpenAI não retornou imagem na resposta. Verifique se sua organização tem acesso ao gpt-image-1.5."
    );
  }

  const generatedBuffer = Buffer.from(imageData.b64_json, "base64");

  // ── 4. Redimensiona pro tamanho final ────────────

  const finalBuffer = await sharp(generatedBuffer)
    .resize(targetDimensions.width, targetDimensions.height, {
      fit: "cover",
      position: "center",
    })
    .png()
    .toBuffer();

  const metadata = await sharp(finalBuffer).metadata();

  await exit(fn, {
    width: metadata.width,
    height: metadata.height,
    sizeBytes: finalBuffer.length,
  });

  return {
    data: finalBuffer,
    mimeType: "image/png",
    width: metadata.width ?? targetDimensions.width,
    height: metadata.height ?? targetDimensions.height,
    promptUsed: finalPrompt,
  };
}
