import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type AppUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  appRole: string;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown;
};

/** Helper para acessar appRole sem cast any */
export function getAppRole(user: { appRole?: string } | null | undefined): string | undefined {
  return user?.appRole;
}

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session as { user: AppUser } | null;
}

export async function requireCreator() {
  const session = await getServerSession();
  if (!session) return null;

  const appRole = session.user.appRole;
  if (appRole !== "CREATOR" && appRole !== "ADMIN") return null;

  return session;
}

export async function requireAdmin() {
  const session = await getServerSession();
  if (!session) return null;

  const appRole = session.user.appRole;
  if (appRole !== "ADMIN") return null;

  return session;
}
