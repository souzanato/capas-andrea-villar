import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dataUrl } = await req.json();
  if (!dataUrl || !dataUrl.startsWith("data:image/png")) {
    return NextResponse.json({ error: "Invalid dataUrl" }, { status: 400 });
  }

  // Converte data URL pra Buffer
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  // Descobre próximo número de versão
  const cover = await db.cover.findUnique({
    where: { id: params.id },
    include: { generatedImages: { orderBy: { version: "desc" }, take: 1 } },
  });

  if (!cover) {
    return NextResponse.json({ error: "Cover not found" }, { status: 404 });
  }

  const appRole = (session.user as { appRole: string }).appRole;
  if (cover.userId !== session.user.id && appRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nextVersion = (cover.generatedImages[0]?.version ?? 0) + 1;

  // Salva o arquivo em /public/generated/[coverId]-v[N].png
  const { writeFile, mkdir } = await import("fs/promises");
  const { join } = await import("path");

  const dir = join(process.cwd(), "public", "generated");
  await mkdir(dir, { recursive: true });

  const filename = `${params.id}-v${nextVersion}.png`;
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);

  const publicUrl = `/generated/${filename}`;

  // Salva GeneratedImage no banco
  const generatedImage = await db.generatedImage.create({
    data: {
      coverId: params.id,
      version: nextVersion,
      data: buffer,
      mimeType: "image/png",
      width: 0, // será atualizado abaixo
      height: 0,
      sizeBytes: buffer.length,
      promptUsed: "konva-export",
    },
  });

  return NextResponse.json({ generatedImage, url: publicUrl });
}
