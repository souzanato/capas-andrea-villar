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

    const cover = await db.cover.findUnique({ where: { id: params.id } });

    if (!cover) {
      return NextResponse.json({ error: "Capa não encontrada" }, { status: 404 });
    }

    if (cover.userId !== session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Regenerar funciona para capas COMPLETED ou FAILED
    if (cover.status !== "COMPLETED" && cover.status !== "FAILED") {
      return NextResponse.json(
        { error: `A capa está em processamento (${cover.status}). Aguarde.` },
        { status: 409 }
      );
    }

    // Reseta o status e dispara o pipeline novamente
    await db.cover.update({
      where: { id: params.id },
      data: { status: "PENDING", errorMessage: null },
    });

    // Dispara sem await para não bloquear — o frontend vai polleer o status
    runFullPipeline(params.id).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno ao regenerar",
      },
      { status: 500 }
    );
  }
}
