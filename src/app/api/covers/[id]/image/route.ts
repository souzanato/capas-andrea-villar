import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
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

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "generated";
  const versionParam = url.searchParams.get("version");

  if (type === "base") {
    const image = await db.image.findUnique({
      where: { id: cover.baseImageId ?? undefined },
    });

    if (!image) {
      return NextResponse.json(
        { error: "Imagem base não encontrada" },
        { status: 404 }
      );
    }

    return new NextResponse(Buffer.from(image.data), {
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  }

  // type === "generated"
  const where = versionParam
    ? { coverId: params.id, version: Number(versionParam) }
    : { coverId: params.id };

  const orderBy = versionParam ? undefined : { version: "desc" as const };

  const generated = await db.generatedImage.findFirst({
    where,
    orderBy,
  });

  if (!generated) {
    return NextResponse.json(
      { error: "Imagem gerada não encontrada" },
      { status: 404 }
    );
  }

  return new NextResponse(Buffer.from(generated.data), {
    headers: {
      "Content-Type": generated.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
