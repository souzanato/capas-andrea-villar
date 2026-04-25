import { db } from "@/lib/db";
import { generatePromptFromInputs } from "./openai";
import { generateImageFromPrompt } from "./gemini";
import { enter, exit, log, error as logError, errorSync, logSync } from "./debug-logger";

/**
 * Executa o pipeline completo para uma capa:
 *   1. Gera o prompt via GPT-4o
 *   2. Gera a imagem via GPT-Image-1.5 (OpenAI)
 *   3. Salva GeneratedImage no banco
 *   4. Atualiza status para COMPLETED (ou FAILED em caso de erro)
 */
export async function runFullPipeline(coverId: string): Promise<void> {
  const fn = "runFullPipeline";
  await enter(fn, { coverId });

  // Captura crash silencioso (unhandled rejection)
  process.once("unhandledRejection", (reason) => {
    logSync("process", "error", { event: "unhandledRejection", reason: String(reason), coverId });
  });

  const pipelineStart = Date.now();

  const cover = await db.cover.findUnique({
    where: { id: coverId },
    include: { baseImage: true },
  });

  if (!cover) { await logError(fn, "Cover not found"); throw new Error("Capa não encontrada."); }
  if (!cover.baseImage) { await logError(fn, "No base image"); throw new Error("Capa sem imagem base."); }

  try {
    // ── 1. GERAÇÃO DO PROMPT ────────────────────────

    await log(fn, "log", { phase: "GENERATING_PROMPT" });
    await db.cover.update({
      where: { id: coverId },
      data: { status: "GENERATING_PROMPT" },
    });

    const imageBase64 = Buffer.from(cover.baseImage.data).toString("base64");
    await log(fn, "log", { phase: "GENERATING_PROMPT", baseImageSize: cover.baseImage.data.length });

    const generatedPrompt = await generatePromptFromInputs({
      title: cover.title,
      format: cover.format,
      contentType: cover.contentType,
      palette: cover.palette,
      accentColor: cover.accentColor,
      customPalette: cover.customPalette as string[] | null,
      imageBase64,
      imageMimeType: cover.baseImage.mimeType,
    });

    await log(fn, "log", { phase: "PROMPT_READY", promptLength: generatedPrompt.length });

    await db.cover.update({
      where: { id: coverId },
      data: { generatedPrompt, status: "GENERATING_IMAGE" },
    });

    // ── 2. GERAÇÃO DA IMAGEM ────────────────────────

    await log(fn, "log", { phase: "GENERATING_IMAGE", promptLength: generatedPrompt.length });

    const result = await generateImageFromPrompt({
      prompt: generatedPrompt,
      baseImageBase64: imageBase64,
      baseImageMimeType: cover.baseImage.mimeType,
      format: cover.format,
    });

    await log(fn, "log", { phase: "IMAGE_READY", sizeBytes: result.data.length, width: result.width, height: result.height });

    // ── 3. SALVA GeneratedImage ─────────────────────

    const latestVersion = await db.generatedImage.findFirst({
      where: { coverId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const version = (latestVersion?.version ?? 0) + 1;

    await db.generatedImage.create({
      data: {
        coverId,
        data: result.data,
        mimeType: result.mimeType,
        width: result.width,
        height: result.height,
        sizeBytes: result.data.length,
        version,
        promptUsed: generatedPrompt,
      },
    });

    // ── 4. FINALIZA ─────────────────────────────────

    await db.cover.update({
      where: { id: coverId },
      data: { status: "COMPLETED" },
    });

    const totalDuration = ((Date.now() - pipelineStart) / 1000).toFixed(1);
    await exit(fn, { status: "COMPLETED", totalDuration: `${totalDuration}s` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno no pipeline";

    await logError(fn, message);

    await db.cover.update({
      where: { id: coverId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    const totalDuration = ((Date.now() - pipelineStart) / 1000).toFixed(1);
    await errorSync(fn, `Pipeline FAILED after ${totalDuration}s`, { coverId, error: message });

    throw error; // repassa para o caller (rota) saber que falhou
  }
}
