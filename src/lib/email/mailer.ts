import nodemailer from "nodemailer";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || host === "smtp.dummyemailservice.com") {
    console.error("[MAILER] SMTP_HOST inválido — verificando .env.local");
    console.error("[MAILER] Possível conflito: variável de ambiente externa sobrescrevendo .env.local");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  console.log("SMTP ENV CHECK:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
  });

  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}
