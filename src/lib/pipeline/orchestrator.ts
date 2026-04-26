import { db } from "@/lib/db";
import { generateImageFromPrompt } from "./gemini";
import { enter, exit, log, error as logError, errorSync, logSync } from "./debug-logger";

/**
 * Pipeline simplificado:
 *   1. Carrega cover + baseImage
 *   2. Chama GPT-Image-1.5 direto (sem GPT-4o)
 *   3. Salva GeneratedImage e marca COMPLETED
 *   4. Em caso de erro, marca FAILED
 */
export async function runFullPipeline(coverId: string): Promise<void> {
  const fn = "runFullPipeline";
  await enter(fn, { coverId });

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
    await log(fn, "log", { phase: "GENERATING_IMAGE", baseImageSize: cover.baseImage.data.length });
    await db.cover.update({
      where: { id: coverId },
      data: { status: "GENERATING_IMAGE" },
    });

    const imageBase64 = Buffer.from(cover.baseImage.data).toString("base64");

    const result = await generateImageFromPrompt({
      title: cover.title,
      accentColor: cover.accentColor,
      format: cover.format,
      baseImageBase64: imageBase64,
      baseImageMimeType: cover.baseImage.mimeType,
    });

    await log(fn, "log", { phase: "IMAGE_READY", sizeBytes: result.data.length, width: result.width, height: result.height });

    // Salva o prompt usado no Cover (campo já existe — aproveitamos)
    await db.cover.update({
      where: { id: coverId },
      data: { generatedPrompt: result.promptUsed },
    });

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
        promptUsed: result.promptUsed,
      },
    });

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

    throw error;
  }
}
