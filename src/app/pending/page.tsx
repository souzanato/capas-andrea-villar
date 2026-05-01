import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import PendingClient from "./PendingClient";

export default async function PendingPage() {
  const session = await getServerSession();

  if (!session?.user) redirect("/login");

  return (
    <PendingClient
      userName={session.user.name ?? ""}
    />
  );
}
