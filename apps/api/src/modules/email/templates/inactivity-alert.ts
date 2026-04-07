export function inactivityAlertTemplate(data: {
  adminName: string;
  inactiveClients: { name: string; daysSinceLast: number }[];
}): { subject: string; html: string } {
  const rows = data.inactiveClients
    .map(
      (c) => `
    <tr>
      <td style="color:#e8e8f0;font-size:13px;padding:10px 12px;border-bottom:1px solid #1e1e28;">${c.name}</td>
      <td style="color:#ff8c5a;font-size:13px;padding:10px 12px;border-bottom:1px solid #1e1e28;font-family:monospace;">
        ${c.daysSinceLast} dia${c.daysSinceLast !== 1 ? 's' : ''} sem treino
      </td>
    </tr>`,
    )
    .join('');

  return {
    subject: `⚠️ ${data.inactiveClients.length} cliente${data.inactiveClients.length !== 1 ? 's' : ''} inactivo${data.inactiveClients.length !== 1 ? 's' : ''} — Lavrador Team`,
    html: `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#111118;border-radius:12px;overflow:hidden;border:1px solid #1e1e28;">
    <tr>
      <td style="background:#ff8c5a;padding:24px 32px;">
        <span style="font-size:22px;font-weight:900;color:#0a0a0f;letter-spacing:-1px;">LAVRADOR TEAM</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <h1 style="color:#e8e8f0;font-size:20px;margin:0 0 8px;">Alerta de inactividade ⚠️</h1>
        <p style="color:#888899;font-size:14px;line-height:1.7;margin:0 0 20px;">
          Olá <strong style="color:#e8e8f0;">${data.adminName}</strong>,<br>
          os seguintes clientes não registam treinos há 7 ou mais dias:
        </p>
        <table style="width:100%;border-collapse:collapse;background:#0d0d13;border:1px solid #2a2a35;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#1a1a22;">
              <th style="color:#666677;font-size:10px;font-family:monospace;letter-spacing:1px;padding:10px 12px;text-align:left;font-weight:400;">CLIENTE</th>
              <th style="color:#666677;font-size:10px;font-family:monospace;letter-spacing:1px;padding:10px 12px;text-align:left;font-weight:400;">INACTIVIDADE</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="${process.env.FRONTEND_URL ?? 'http://localhost:4501'}/clients"
           style="display:inline-block;margin-top:20px;background:#ff8c5a;color:#0a0a0f;text-decoration:none;padding:12px 24px;border-radius:7px;font-weight:700;font-size:14px;">
          Ver clientes →
        </a>
        <p style="color:#444455;font-size:11px;margin:24px 0 0;font-family:monospace;">
          Lavrador Team · Alerta automático diário
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}
