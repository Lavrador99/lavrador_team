export function welcomeTemplate(name: string): { subject: string; html: string } {
  return {
    subject: 'Bem-vindo ao Lavrador Team! 💪',
    html: `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#111118;border-radius:12px;overflow:hidden;border:1px solid #1e1e28;">
    <tr>
      <td style="background:#c8f542;padding:24px 32px;">
        <span style="font-size:22px;font-weight:900;color:#0a0a0f;letter-spacing:-1px;">LAVRADOR TEAM</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h1 style="color:#e8e8f0;font-size:22px;margin:0 0 12px;">Olá, ${name}! 👋</h1>
        <p style="color:#888899;font-size:14px;line-height:1.7;margin:0 0 20px;">
          A tua conta no Lavrador Team foi criada com sucesso.<br>
          Acede à plataforma para veres o teu plano de treino e registares os teus progressos.
        </p>
        <a href="${process.env.FRONTEND_URL ?? 'http://localhost:4501'}"
           style="display:inline-block;background:#c8f542;color:#0a0a0f;text-decoration:none;padding:12px 24px;border-radius:7px;font-weight:700;font-size:14px;">
          Entrar na plataforma →
        </a>
        <p style="color:#444455;font-size:11px;margin:24px 0 0;font-family:monospace;">
          Lavrador Team · Personal Training Management
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
