import { sendEmail } from "./mailer";
import {
  profileRequestAdminEmailHtml,
  profileApprovedEmailHtml,
  profileRejectedEmailHtml,
} from "./templates";
import { db } from "@/lib/db";

export async function sendProfileRequestNotification(
  userName: string,
  userEmail: string
): Promise<void> {
  // Busca email do admin
  const admin = await db.user.findFirst({
    where: { appRole: "ADMIN" },
    select: { email: true },
  });

  if (!admin?.email) return;

  await sendEmail({
    to: admin.email,
    subject: "Nova solicitação de perfil — Capas Andrea Villar",
    html: profileRequestAdminEmailHtml(userName, userEmail),
  });
}

export async function sendProfileApprovedEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  await sendEmail({
    to: userEmail,
    subject: "Perfil aprovado! — Capas Andrea Villar",
    html: profileApprovedEmailHtml(userName),
  });
}

export async function sendProfileRejectedEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  await sendEmail({
    to: userEmail,
    subject: "Atualização sobre sua solicitação — Capas Andrea Villar",
    html: profileRejectedEmailHtml(userName),
  });
}
