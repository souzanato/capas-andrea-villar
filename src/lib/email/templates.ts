const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Wrapper base para todos os emails
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capas Andrea Villar</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF5F2;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF5F2;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e0da;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1F3247;padding:24px 32px;">
              <p style="margin:0;color:#FAF5F2;font-size:18px;font-weight:600;letter-spacing:0.5px;">
                Capas Andrea Villar
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e8e0da;">
              <p style="margin:0;color:#999;font-size:12px;">
                Este email foi enviado automaticamente. Não responda a esta mensagem.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Botão padrão
function buttonHtml(href: string, label: string, color = "#1F4E8C"): string {
  return `
<p style="text-align:center;margin:28px 0;">
  <a href="${href}"
     style="background-color:${color};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
    ${label}
  </a>
</p>
  `;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function confirmationEmailHtml(userName: string, url: string): string {
  return emailWrapper(`
    <h1 style="margin:0 0 8px;color:#1F3247;font-size:22px;">Confirme seu email</h1>
    <p style="color:#555;margin:0 0 20px;">Olá${userName ? `, ${userName}` : ""}! Para ativar sua conta, clique no botão abaixo.</p>
    ${buttonHtml(url, "Confirmar email")}
    <p style="color:#888;font-size:13px;text-align:center;">
      Ou copie e cole este link no navegador:<br>
      <a href="${url}" style="color:#1F4E8C;word-break:break-all;">${url}</a>
    </p>
    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:20px;">
      Se você não criou uma conta, ignore este email.
    </p>
  `);
}

export function passwordResetEmailHtml(userName: string, url: string): string {
  return emailWrapper(`
    <h1 style="margin:0 0 8px;color:#1F3247;font-size:22px;">Redefinir senha</h1>
    <p style="color:#555;margin:0 0 20px;">Olá${userName ? `, ${userName}` : ""}! Recebemos uma solicitação para redefinir a senha da sua conta.</p>
    ${buttonHtml(url, "Redefinir senha", "#C8644D")}
    <p style="color:#888;font-size:13px;text-align:center;">
      Ou copie e cole este link no navegador:<br>
      <a href="${url}" style="color:#C8644D;word-break:break-all;">${url}</a>
    </p>
    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:20px;">
      Se você não solicitou a redefinição, ignore este email. Sua senha não será alterada.
    </p>
  `);
}

export function profileRequestAdminEmailHtml(
  userName: string,
  userEmail: string
): string {
  const url = `${BASE_URL}/admin/requests`;
  return emailWrapper(`
    <h1 style="margin:0 0 8px;color:#1F3247;font-size:22px;">Nova solicitação de perfil</h1>
    <p style="color:#555;margin:0 0 20px;">
      Um novo usuário solicitou o perfil de criador(a):
    </p>
    <table style="width:100%;border:1px solid #e8e0da;border-radius:8px;padding:16px;margin-bottom:20px;">
      <tr>
        <td style="color:#888;font-size:13px;padding:4px 0;">Nome</td>
        <td style="color:#1F3247;font-weight:600;font-size:14px;padding:4px 0;">${userName}</td>
      </tr>
      <tr>
        <td style="color:#888;font-size:13px;padding:4px 0;">Email</td>
        <td style="color:#1F3247;font-size:14px;padding:4px 0;">${userEmail}</td>
      </tr>
    </table>
    ${buttonHtml(url, "Ver solicitações pendentes")}
  `);
}

export function profileApprovedEmailHtml(userName: string): string {
  const url = `${BASE_URL}/dashboard`;
  return emailWrapper(`
    <h1 style="margin:0 0 8px;color:#1F3247;font-size:22px;">Perfil aprovado! 🎉</h1>
    <p style="color:#555;margin:0 0 20px;">
      Olá${userName ? `, ${userName}` : ""}! Sua solicitação foi aprovada. Você agora tem acesso completo para criar capas.
    </p>
    ${buttonHtml(url, "Acessar minha conta", "#2D7A6E")}
  `);
}

export function profileRejectedEmailHtml(userName: string): string {
  return emailWrapper(`
    <h1 style="margin:0 0 8px;color:#1F3247;font-size:22px;">Solicitação não aprovada</h1>
    <p style="color:#555;margin:0 0 20px;">
      Olá${userName ? `, ${userName}` : ""}! Infelizmente sua solicitação de perfil de criador(a) não foi aprovada neste momento.
    </p>
    <p style="color:#555;">
      Se acredita que houve um engano ou deseja mais informações, entre em contato com o suporte.
    </p>
  `);
}
