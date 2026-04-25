import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { runFullPipeline } from "@/lib/pipeline/orchestrator";
import { log, error as logError, logSync } from "@/lib/pipeline/debug-logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const fn = "POST /api/covers/[id]/generate";

  // ── Crash handlers para capturar qualquer erro não tratado ──
  const crashHandler = (event: string) => (reason: unknown) => {
    logSync("process", "error", { event, reason: String(reason) });
  };
  process.once("unhandledRejection", crashHandler("unhandledRejection"));
  process.once("uncaughtException", crashHandler("uncaughtException"));

  await log(fn, "enter", { coverId: params.id });

  try {
    const session = await auth();

    if (!session?.user?.id) {
      await log(fn, "exit", { status: 401, error: "Not authenticated" });
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const cover = await db.cover.findUnique({ where: { id: params.id } });

    if (!cover) {
      await log(fn, "exit", { status: 404, error: "Cover not found" });
      return NextResponse.json({ error: "Capa não encontrada" }, { status: 404 });
    }

    if (cover.userId !== session.user.id) {
      await log(fn, "exit", { status: 403, error: "Not authorized" });
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    if (cover.status !== "PENDING" && cover.status !== "FAILED") {
      await log(fn, "exit", { status: 409, error: `Already processing: ${cover.status}` });
      return NextResponse.json(
        { error: `Capa já está em processamento (${cover.status})` },
        { status: 409 }
      );
    }

    await log(fn, "log", { phase: "starting_pipeline", coverId: params.id, status: cover.status });

    await runFullPipeline(params.id);

    await log(fn, "exit", { status: 200, success: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pipeline error:", error);
    await logError(fn, error instanceof Error ? error.message : "Unknown error");

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro interno no pipeline",
      },
      { status: 500 }
    );
  }
}
