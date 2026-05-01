import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendProfileRequestNotification } from "@/lib/email";
import { headers } from "next/headers";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const userId = session.user.id;

  // Verifica se já tem solicitação pendente
  const existing = await db.profileRequest.findFirst({
    where: { userId, status: "PENDING" },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Você já tem uma solicitação pendente" },
      { status: 409 }
    );
  }

  // Cria solicitação
  const request = await db.profileRequest.create({
    data: { userId },
    include: { user: { select: { name: true, email: true } } },
  });

  // Notifica admin por email (não bloquear se falhar)
  try {
    await sendProfileRequestNotification(
      request.user.name ?? "Usuário",
      request.user.email
    );
  } catch (error) {
    console.error("[PROFILE_REQUEST] Erro ao notificar admin:", error);
  }

  return NextResponse.json({ success: true, requestId: request.id });
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const request = await db.profileRequest.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ request });
}
