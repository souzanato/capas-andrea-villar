import { db } from "@/lib/db";
import { analyzeCover } from "./analyze-cover";
import { enter, exit, log, error as logError, errorSync } from "./debug-logger";
import type { Prisma } from "@prisma/client";

/**
 * Pipeline novo:
 *   1. Carrega cover + baseImage
 *   2. Chama GPT-4o vision -> retorna JSON de layout
 *   3. Salva layoutJson no Cover
 *   4. Marca COMPLETED
 *
 * NAO gera mais imagem editada nessa fase.
 * A renderizacao do PNG vai acontecer no editor (client-side, via Konva).
 */
export async function runFullPipeline(coverId: string): Promise<void> {
  const fn = "runFullPipeline";
  await enter(fn, { coverId });

  const pipelineStart = Date.now();

  const cover = await db.cover.findUnique({
    where: { id: coverId },
    include: { baseImage: true },
  });

  if (!cover) { await logError(fn, "Cover not found"); throw new Error("Capa nao encontrada."); }
  if (!cover.baseImage) { await logError(fn, "No base image"); throw new Error("Capa sem imagem base."); }

  try {
    await log(fn, "log", { phase: "GENERATING_PROMPT" });
    await db.cover.update({
      where: { id: coverId },
      data: { status: "GENERATING_PROMPT" },
    });

    const imageBase64 = Buffer.from(cover.baseImage.data).toString("base64");

    const layout = await analyzeCover({
      title: cover.title,
      accentHex: cover.accentColor ?? "#1F4E8C",
      format: cover.format,
      themeId: cover.themeId ?? "andrea-editorial",
      baseImageBase64: imageBase64,
      baseImageMimeType: cover.baseImage.mimeType,
    });

    await log(fn, "log", { phase: "LAYOUT_READY", textBlocksCount: layout.textBlocks.length });

    await db.cover.update({
      where: { id: coverId },
      data: {
        status: "COMPLETED",
        layoutJson: layout as Prisma.InputJsonValue,
      },
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
