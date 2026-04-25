import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runRefinementPipeline } from "@/lib/pipeline/refine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const cover = await db.cover.findUnique({
      where: { id: params.id },
      select: { userId: true, status: true },
    });

    if (!cover) {
      return NextResponse.json({ error: "Capa não encontrada" }, { status: 404 });
    }

    if (cover.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (cover.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "A capa precisa estar concluída para receber refinos" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const { message } = body as { message?: string };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Mensagem inválida" },
        { status: 400 }
      );
    }

    // Salva mensagem do usuário
    await db.message.create({
      data: {
        coverId: params.id,
        role: "USER",
        content: message.trim(),
      },
    });

    // Atualiza status para processamento
    await db.cover.update({
      where: { id: params.id },
      data: { status: "GENERATING_IMAGE" },
    });

    // Executa pipeline de refino
    const result = await runRefinementPipeline({
      coverId: params.id,
      userMessage: message.trim(),
    });

    // Finaliza com sucesso
    await db.cover.update({
      where: { id: params.id },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({
      newVersion: result.newVersion,
      assistantMessage: result.assistantMessage,
    });
  } catch (error) {
    console.error("Refinement pipeline error:", error);

    // Marca como falha
    await db.cover.update({
      where: { id: params.id },
      data: {
        status: "FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Erro interno no refino",
      },
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno no refino",
      },
      { status: 500 }
    );
  }
}
