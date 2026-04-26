import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import CoverStatusPoller from "@/components/CoverStatusPoller";
import CoverDetail from "@/components/CoverDetail";
import CoverGenerating from "@/components/CoverGenerating";
import RetryButton from "@/components/RetryButton";

interface CoverDetailPageProps {
  params: { id: string };
}

export default async function CoverDetailPage({
  params,
}: CoverDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const cover = await db.cover.findUnique({
    where: { id: params.id },
    include: {
      baseImage: {
        select: {
          id: true,
          width: true,
          height: true,
          mimeType: true,
        },
      },
      generatedImages: {
        orderBy: { version: "desc" },
        select: {
          version: true,
          width: true,
          height: true,
        },
      },
    },
  });

  if (!cover) {
    notFound();
  }

  if (cover.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const isProcessing =
    cover.status === "PENDING" ||
    cover.status === "GENERATING_IMAGE";

  // Serialize for client component (Dates → strings)
  const serializedCover = JSON.parse(JSON.stringify(cover));

  return (
    <div className="space-y-6 bg-background min-h-full">
      <CoverStatusPoller coverId={cover.id} initialStatus={cover.status} />

      {isProcessing && (
        <CoverGenerating status={cover.status} />
      )}

      {cover.status === "COMPLETED" && (
        <CoverDetail cover={serializedCover} />
      )}

      {cover.status === "FAILED" && (
        <div className="space-y-6">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 space-y-4">
            <h2 className="text-lg font-medium text-foreground tracking-tight">
              Erro ao processar capa
            </h2>
            <p className="text-sm text-foreground-soft">
              {cover.errorMessage || "Erro desconhecido"}
            </p>
            <RetryButton coverId={cover.id} />
          </div>
        </div>
      )}
    </div>
  );
}
