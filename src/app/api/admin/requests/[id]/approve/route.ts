import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendProfileApprovedEmail } from "@/lib/email";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const appRole = (session?.user as { appRole?: string })?.appRole;

  if (!session?.user?.id || appRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const request = await db.profileRequest.findUnique({
    where: { id: params.id },
    include: { user: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  // Atualiza solicitação
  await db.profileRequest.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  // Promove usuário para CREATOR
  await db.user.update({
    where: { id: request.userId },
    data: { appRole: "CREATOR" },
  });

  // Envia email de aprovação
  try {
    await sendProfileApprovedEmail(
      request.user.email,
      request.user.name ?? ""
    );
  } catch (error) {
    console.error("[APPROVE] Erro ao enviar email:", error);
  }

  return NextResponse.json({ success: true });
}
