import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const cover = await db.cover.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, errorMessage: true },
  });

  if (!cover) {
    return NextResponse.json({ error: "Capa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(cover);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  await db.cover.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
