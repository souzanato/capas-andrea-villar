import sharp from "sharp";
import { GoogleGenAI } from "@google/genai";
import { enter, exit, log, error as logError } from "./debug-logger";

// ── Dimensões esperadas por formato ─────────────────

export const FORMAT_DIMENSIONS = {
  REELS_9_16: { width: 1080, height: 1920 },
  FEED_1_1: { width: 1080, height: 1080 },
  CAROUSEL_4_5: { width: 1080, height: 1350 },
} as const;

// ── Tipos ──────────────────────────────────────────

export interface ImageGenerationInput {
  prompt: string;
  baseImageBase64: string;
  baseImageMimeType: string;
  format: "REELS_9_16" | "FEED_1_1" | "CAROUSEL_4_5";
}

export interface GeneratedImageResult {
  data: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

// ── Função principal ───────────────────────────────

/**
 * Chama o Gemini (Nano Banana) para gerar/editar a imagem com
 * o prompt extraído do GPT + imagem base do usuário.
 *
 * Modelo usado: gemini-2.5-flash-image
 * (Nano Banana — geração/edição nativa de imagens)
 */
export async function generateImageFromPrompt(
  input: ImageGenerationInput
): Promise<GeneratedImageResult> {
  const fn = "generateImageFromPrompt";
  await enter(fn, { format: input.format, promptLength: input.prompt.length, baseImageSize: input.baseImageBase64.length });

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    await logError(fn, "GEMINI_API_KEY not configured");
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const GEMINI_TIMEOUT_MS = 120_000;
  await log(fn, "log", { phase: "gemini_call", timeout: `${GEMINI_TIMEOUT_MS / 1000}s` });
  await log(fn, "http_request", { model: "gemini-2.5-flash-image", promptLength: input.prompt.length, responseModalities: ["TEXT", "IMAGE"] });

  const geminiPromise = ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      {
        role: "user",
        parts: [
          { text: input.prompt },
          {
            inlineData: {
              mimeType: input.baseImageMimeType,
              data: input.baseImageBase64,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    setTimeout(
      () => reject(new Error(`Gemini request timed out after ${GEMINI_TIMEOUT_MS / 1000}s`)),
      GEMINI_TIMEOUT_MS
    );
  });

  const response = await Promise.race([geminiPromise, timeoutPromise]);

  await log(fn, "http_response", { hasCandidates: !!response.candidates?.length });

  const candidate = response.candidates?.[0];

  if (!candidate) {
    await logError(fn, "No candidates in response");
    throw new Error("Gemini não retornou candidatos na resposta.");
  }

  const imagePart = candidate.content?.parts?.find(
    (p) => p.inlineData
  );

  if (!imagePart?.inlineData) {
    await logError(fn, "No image in Gemini response", { textParts: candidate.content?.parts?.filter(p => p.text).map(p => p.text?.substring(0, 100)) });
    throw new Error(
      "Gemini não retornou imagem na resposta. Verifique se o modelo suporta geração de imagem."
    );
  }

  const base64Data = imagePart.inlineData.data!;
  const buffer = Buffer.from(base64Data, "base64");
  const metadata = await sharp(buffer).metadata();

  await exit(fn, { width: metadata.width, height: metadata.height, sizeBytes: buffer.length, mimeType: imagePart.inlineData.mimeType });

  return {
    data: buffer,
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
    width: metadata.width ?? FORMAT_DIMENSIONS[input.format].width,
    height: metadata.height ?? FORMAT_DIMENSIONS[input.format].height,
  };
}
