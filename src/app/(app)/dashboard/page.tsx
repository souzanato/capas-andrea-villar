import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import type { Prisma, Status } from "@prisma/client";
import DashboardClient from "@/components/dashboard/DashboardClient";

interface DashboardPageProps {
  searchParams: {
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  };
}

const ALLOWED_STATUSES = [
  "PENDING",
  "GENERATING_PROMPT",
  "GENERATING_IMAGE",
  "COMPLETED",
  "FAILED",
];

const VALID_SORTS = ["newest", "oldest", "title"];

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const q = searchParams.q?.trim() ?? "";
  const status = searchParams.status ?? "";
  const sort = VALID_SORTS.includes(searchParams.sort ?? "")
    ? searchParams.sort!
    : "newest";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = 20;

  const where: Prisma.CoverWhereInput = {
    userId: session.user.id,
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

  const [covers, total] = await Promise.all([
    db.cover.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        format: true,
        status: true,
        createdAt: true,
        contentType: true,
        baseImageId: true,
        generatedImages: {
          orderBy: { version: "desc" },
          take: 1,
          select: {
            id: true,
            version: true,
            width: true,
            height: true,
          },
        },
      },
    }),
    db.cover.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const serialized = JSON.parse(JSON.stringify(covers));

  return (
    <DashboardClient
      initialCovers={serialized}
      total={total}
      page={page}
      totalPages={totalPages}
      currentQ={q}
      currentStatus={status}
      currentSort={sort}
    />
  );
}
