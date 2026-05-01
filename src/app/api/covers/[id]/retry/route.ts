import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runFullPipeline } from "@/lib/pipeline/orchestrator";
import { headers } from "next/headers";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const cover = await db.cover.findUnique({ where: { id: params.id } });

    if (!cover) {
      return NextResponse.json({ error: "Capa não encontrada" }, { status: 404 });
    }

    const appRole = (session.user as { appRole: string }).appRole;
    if (cover.userId !== session.user.id && appRole !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (cover.status !== "FAILED") {
      return NextResponse.json(
        { error: `Só é possível repetir capas com status FAILED (atual: ${cover.status})` },
        { status: 409 }
      );
    }

    // Reseta o status e dispara o pipeline novamente
    await db.cover.update({
      where: { id: params.id },
      data: { status: "PENDING", errorMessage: null },
    });

    await runFullPipeline(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno ao repetir pipeline",
      },
      { status: 500 }
    );
  }
}
