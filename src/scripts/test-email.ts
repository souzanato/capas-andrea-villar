import nodemailer from "nodemailer";

async function testEmail() {
  console.log("SMTP CONFIG:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM,
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Testar conexão
  console.log("Testando conexão SMTP...");
  await transporter.verify();
  console.log("✅ Conexão SMTP OK");

  // Enviar email de teste
  console.log("Enviando email de teste...");
  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: "renatocdesouza@gmail.com",
    subject: "Teste SMTP — Capas Andrea Villar",
    html: "<p>Se você recebeu isso, o SMTP está funcionando!</p>",
  });

  console.log("✅ Email enviado:", result.messageId);
}

testEmail().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
