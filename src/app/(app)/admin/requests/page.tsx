import { db } from "@/lib/db";
import RequestsClient from "./RequestsClient";

export default async function RequestsPage() {
  const requests = await db.profileRequest.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { id: true, name: true, email: true, image: true, createdAt: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Solicitações de perfil</h1>
        <span className="text-sm text-muted-foreground">
          {requests.length} pendente{requests.length !== 1 ? "s" : ""}
        </span>
      </div>
      <RequestsClient requests={requests} />
    </div>
  );
}
