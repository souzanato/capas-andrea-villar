import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runFullPipeline } from "@/lib/pipeline/orchestrator";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const original = await db.cover.findUnique({
      where: { id: params.id },
      include: { baseImage: true },
    });

    if (!original) {
      return NextResponse.json({ error: "Capa não encontrada" }, { status: 404 });
    }

    if (original.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (!original.baseImage) {
      return NextResponse.json(
        { error: "Capa original sem imagem base" },
        { status: 422 }
      );
    }

    // Duplica em transação: copia imagem base + cria nova capa
    const newCover = await db.$transaction(async (tx) => {
      const newImage = await tx.image.create({
        data: {
          data: original.baseImage!.data,
          mimeType: original.baseImage!.mimeType,
          width: original.baseImage!.width,
          height: original.baseImage!.height,
          sizeBytes: original.baseImage!.sizeBytes,
        },
      });

      return tx.cover.create({
        data: {
          userId: session.user.id,
          title: `${original.title} (cópia)`,
          format: original.format,
          contentType: original.contentType,
          palette: original.palette,
          accentColor: original.accentColor,
          customPalette: original.customPalette ?? undefined,
          baseImageId: newImage.id,
          status: "PENDING",
          metaPromptVersion: original.metaPromptVersion,
        },
      });
    });

    // Dispara pipeline em background
    runFullPipeline(newCover.id).catch((err) => {
      console.error("Erro no pipeline da capa duplicada:", err);
    });

    return NextResponse.json({ newCoverId: newCover.id });
  } catch (error) {
    console.error("Error duplicating cover:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao duplicar" },
      { status: 500 }
    );
  }
}
