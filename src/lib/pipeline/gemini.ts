import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";
import { readFile } from "fs/promises";
import path from "path";
import { enter, exit, log, error as logError } from "./debug-logger";


// ── Dimensões finais por formato ─────────────────


export const FORMAT_DIMENSIONS = {
  REELS_9_16: { width: 1080, height: 1920 },
  FEED_1_1: { width: 1080, height: 1080 },
  CAROUSEL_4_5: { width: 1080, height: 1350 },
} as const;


// ── Descrição de formato pra injetar no prompt ─────


const FORMAT_DESC_BY_FORMAT = {
  REELS_9_16: "9:16 vertical Instagram/Reels",
  FEED_1_1: "1:1 square Instagram feed",
  CAROUSEL_4_5: "4:5 portrait Instagram carousel",
};


// ── Mapeamento hex → nome de cor descritivo ────────


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
 * Gera a imagem final da capa via Gemini 3.1 Flash Image (Nano Banana 2).
 *
 * Modelo: gemini-3.1-flash-image-preview
 * (Voltamos do GPT-Image-1.5 pra reduzir custo de ~$0.08 → ~$0.04 por imagem)
 *
 * O prompt vem do template em prompts/cover-prompt-v1.md, com placeholders
 * [TITLE], [ACCENT_NAME], [ACCENT_HEX] e [FORMAT_DESC] substituídos.
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


  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    await logError(fn, "GEMINI_API_KEY not configured");
    throw new Error("GEMINI_API_KEY não configurada.");
  }


  // ── 1. Monta o prompt ────────────────────────────


  const template = await loadPromptTemplate();
  const accentHex = input.accentColor ?? "#1F4E8C";
  const finalPrompt = buildPrompt(template, input.title, accentHex, input.format);


  await log(fn, "log", { phase: "prompt_ready", promptLength: finalPrompt.length });


  // ── 2. Chama Gemini Flash Image ──────────────────


  const targetDimensions = FORMAT_DIMENSIONS[input.format];
  const GEMINI_TIMEOUT_MS = 120_000;


  await log(fn, "http_request", {
    model: "gemini-3.1-flash-image-preview",
    promptLength: finalPrompt.length,
  });


  const ai = new GoogleGenAI({ apiKey });


  const geminiPromise = ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: input.baseImageMimeType,
              data: input.baseImageBase64,
            },
          },
          { text: finalPrompt },
        ],
      },
    ],
  });


  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS / 1000}s`)),
      GEMINI_TIMEOUT_MS
    );
  });


  const response = await Promise.race([geminiPromise, timeoutPromise]);


  // ── 3. Extrai imagem da resposta ─────────────────


  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    await logError(fn, "No candidates in Gemini response");
    throw new Error("Gemini não retornou candidatos na resposta.");
  }


  const parts = candidates[0]?.content?.parts ?? [];
  let inlineDataB64: string | null = null;
  let inlineMimeType = "image/png";


  for (const part of parts) {
    if (part.inlineData?.data) {
      inlineDataB64 = part.inlineData.data;
      inlineMimeType = part.inlineData.mimeType ?? "image/png";
      break;
    }
  }


  if (!inlineDataB64) {
    await logError(fn, "No inline image in Gemini response", {
      partsCount: parts.length,
      response: JSON.stringify(response).substring(0, 500),
    });
    throw new Error("Gemini não retornou imagem na resposta.");
  }


  await log(fn, "http_response", {
    status: "ok",
    mimeType: inlineMimeType,
    dataLength: inlineDataB64.length,
  });


  const generatedBuffer = Buffer.from(inlineDataB64, "base64");


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
