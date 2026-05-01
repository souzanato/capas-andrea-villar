import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma, Status } from "@prisma/client";
import sharp from "sharp";
import { coverFormSchema } from "@/lib/validators/cover";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const appRole = (session.user as { appRole: string }).appRole;
  const userId = session.user.id;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const sort = url.searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));

  const ALLOWED_STATUSES = ["PENDING", "GENERATING_PROMPT", "GENERATING_IMAGE", "COMPLETED", "FAILED"];

  // ADMIN vê todas as capas, CREATOR vê só as suas
  const filterUserId = appRole === "ADMIN"
    ? url.searchParams.get("creatorId") || undefined
    : userId;

  const where: Prisma.CoverWhereInput = {
    ...(filterUserId ? { userId: filterUserId } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  if (status && ALLOWED_STATUSES.includes(status)) {
    where.status = status as Status;
  }

  const orderBy: Prisma.CoverOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "title"
        ? { title: "asc" }
        : { createdAt: "desc" };

  const coverSelect: Record<string, unknown> = {
    id: true,
    title: true,
    format: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    contentType: true,
    generatedImages: {
      orderBy: { version: "desc" as const },
      take: 1,
      select: {
        id: true,
        version: true,
        width: true,
        height: true,
      },
    },
  };

  // Incluir dados do criador para admin
  if (appRole === "ADMIN") {
    coverSelect.user = { select: { id: true, name: true, email: true } };
  }

  const [covers, total] = await Promise.all([
    db.cover.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: coverSelect,
    }),
    db.cover.count({ where }),
  ]);

  return NextResponse.json({
    covers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const appRole = (session.user as { appRole: string }).appRole;
  if (appRole !== "CREATOR" && appRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const format = formData.get("format") as string;
    const accentColor = formData.get("accentColor") as string | null;
    const imageFile = formData.get("imageFile") as File | null;

    // Validação dos campos de texto
    const parsed = coverFormSchema.safeParse({
      title,
      format,
      accentColor: accentColor || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: "Imagem base é obrigatória" },
        { status: 422 }
      );
    }

    // Validação da imagem
    const allowedMimes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "Formato de imagem não aceito" },
        { status: 422 }
      );
    }
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Imagem muito grande. Máximo 10MB" },
        { status: 422 }
      );
    }

    // Processa imagem com sharp
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: "Não foi possível ler as dimensões da imagem" },
        { status: 422 }
      );
    }

    // Cria registros em transação
    const cover = await db.$transaction(async (tx) => {
      const image = await tx.image.create({
        data: {
          data: buffer,
          mimeType: imageFile.type,
          width: metadata.width!,
          height: metadata.height!,
          sizeBytes: buffer.length,
        },
      });

      return tx.cover.create({
        data: {
          userId: session.user.id,
          title: parsed.data.title,
          format: parsed.data.format,
          contentType: "maternidade",      // valor fixo (campo legado)
          palette: "andrea",                // valor fixo (campo legado)
          accentColor: parsed.data.accentColor,
          baseImageId: image.id,
          status: "PENDING",
          themeId: "andrea-editorial",
          metaPromptVersion: "v1-simple",
        },
      });
    });

    return NextResponse.json({ coverId: cover.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating cover:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar capa" },
      { status: 500 }
    );
  }
}
