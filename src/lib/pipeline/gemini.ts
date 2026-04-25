import sharp from "sharp";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { enter, exit, log, error as logError } from "./debug-logger";

// ── Dimensões esperadas por formato ─────────────────

export const FORMAT_DIMENSIONS = {
  REELS_9_16: { width: 1080, height: 1920 },
  FEED_1_1: { width: 1080, height: 1080 },
  CAROUSEL_4_5: { width: 1080, height: 1350 },
} as const;

// ── Mapeamento de formato → tamanho aceito pela OpenAI ──
// OpenAI gpt-image-1.5 só aceita 3 tamanhos: 1024x1024, 1024x1536, 1536x1024
// Sharp redimensiona depois pra dimensão final do app

const OPENAI_SIZE_BY_FORMAT = {
  REELS_9_16: "1024x1536" as const,   // portrait 2:3 → redim. 1080x1920
  FEED_1_1: "1024x1024" as const,     // square → redim. 1080x1080
  CAROUSEL_4_5: "1024x1536" as const, // portrait 2:3 → redim. 1080x1350
};

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
 * Chama o GPT-Image-1.5 (OpenAI) para gerar/editar a imagem com
 * o prompt extraído do GPT + imagem base do usuário.
 *
 * Modelo usado: gpt-image-1.5
 * (Substituiu Gemini 2.5 Flash Image por melhor renderização de
 *  texto em português — acentos como "â", "ç", "ã" saem corretos)
 */
export async function generateImageFromPrompt(
  input: ImageGenerationInput
): Promise<GeneratedImageResult> {
  const fn = "generateImageFromPrompt";
  await enter(fn, {
    format: input.format,
    promptLength: input.prompt.length,
    baseImageSize: input.baseImageBase64.length,
  });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    await logError(fn, "OPENAI_API_KEY not configured");
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  const openai = new OpenAI({ apiKey });

  const OPENAI_TIMEOUT_MS = 120_000;
  const targetDimensions = FORMAT_DIMENSIONS[input.format];
  const openaiSize = OPENAI_SIZE_BY_FORMAT[input.format];

  // ── Prepara imagem base como PNG (OpenAI exige PNG/WEBP/JPG) ──

  await log(fn, "log", { phase: "prepare_image", inputMime: input.baseImageMimeType });

  const baseBuffer = Buffer.from(input.baseImageBase64, "base64");

  // Converte pra PNG e garante tamanho razoável (≤50MB exigido pela OpenAI;
  // limitamos a 4MB pra rapidez de upload)
  const pngBuffer = await sharp(baseBuffer)
    .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  await log(fn, "log", {
    phase: "image_ready",
    originalSize: baseBuffer.length,
    pngSize: pngBuffer.length,
  });

  // ── Chama OpenAI Images Edit ─────────────────────

  await log(fn, "log", { phase: "openai_call", timeout: `${OPENAI_TIMEOUT_MS / 1000}s` });
  await log(fn, "http_request", {
    model: "gpt-image-1.5",
    promptLength: input.prompt.length,
    size: openaiSize,
    quality: "high",
    input_fidelity: "high",
  });

  const imageFile = await toFile(pngBuffer, "base.png", { type: "image/png" });

  const openaiPromise = openai.images.edit({
    model: "gpt-image-1.5",
    image: imageFile,
    prompt: input.prompt,
    size: openaiSize,
    quality: "high",
    input_fidelity: "high",  // ← preserva rosto, pose, ambiente
    n: 1,
  } as any);

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
      "OpenAI não retornou imagem na resposta. Verifique se sua organização tem acesso ao gpt-image-1.5 (pode exigir verificação em platform.openai.com/account/organization)."
    );
  }

  const generatedBuffer = Buffer.from(imageData.b64_json, "base64");

  // ── Redimensiona pro tamanho final do formato ──

  await log(fn, "log", {
    phase: "resize_to_target",
    from: openaiSize,
    to: `${targetDimensions.width}x${targetDimensions.height}`,
  });

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
    mimeType: "image/png",
  });

  return {
    data: finalBuffer,
    mimeType: "image/png",
    width: metadata.width ?? targetDimensions.width,
    height: metadata.height ?? targetDimensions.height,
  };
}
