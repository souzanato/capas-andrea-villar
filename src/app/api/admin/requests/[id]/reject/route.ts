import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendProfileRejectedEmail } from "@/lib/email";
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

  await db.profileRequest.update({
    where: { id: params.id },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  try {
    await sendProfileRejectedEmail(
      request.user.email,
      request.user.name ?? ""
    );
  } catch (error) {
    console.error("[REJECT] Erro ao enviar email:", error);
  }

  return NextResponse.json({ success: true });
}
