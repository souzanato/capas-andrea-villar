import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { headers } from "next/headers";

const schema = z.object({
  role: z.enum(["VIEWER", "CREATOR", "ADMIN"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  const appRole = (session?.user as { appRole?: string })?.appRole;

  if (!session?.user?.id || appRole !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Admin não pode rebaixar a si mesmo
  if (params.id === session.user.id) {
    return NextResponse.json(
      { error: "Você não pode alterar seu próprio perfil" },
      { status: 400 }
    );
  }

  const { role: newRole } = schema.parse(await req.json());

  await db.user.update({
    where: { id: params.id },
    data: { appRole: newRole },
  });

  return NextResponse.json({ success: true });
}
