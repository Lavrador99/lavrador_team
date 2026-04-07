export function planUpdatedTemplate(data: {
  clientName: string;
  planName: string;
}): { subject: string; html: string } {
  return {
    subject: `Novo plano disponível: ${data.planName}`,
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
        <h1 style="color:#e8e8f0;font-size:20px;margin:0 0 12px;">Novo plano disponível 🏋️</h1>
        <p style="color:#888899;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Olá <strong style="color:#e8e8f0;">${data.clientName}</strong>!<br>
          O teu treinador criou um novo plano de treino para ti:<br>
          <strong style="color:#c8f542;font-size:16px;">${data.planName}</strong>
        </p>
        <a href="${process.env.FRONTEND_URL ?? 'http://localhost:4501'}/my-plan"
           style="display:inline-block;background:#c8f542;color:#0a0a0f;text-decoration:none;padding:12px 24px;border-radius:7px;font-weight:700;font-size:14px;">
          Ver o meu plano →
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
