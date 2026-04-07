export function sessionReminderTemplate(data: {
  clientName: string;
  date: string;   // e.g. "terça-feira, 08 de abril"
  time: string;   // e.g. "10:00"
  duration: number;
  type: string;
}): { subject: string; html: string } {
  const typeLabel: Record<string, string> = {
    TRAINING:   'Treino',
    ASSESSMENT: 'Avaliação',
    FOLLOWUP:   'Acompanhamento',
  };

  return {
    subject: `Sessão marcada — ${data.date} às ${data.time}`,
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
        <h1 style="color:#e8e8f0;font-size:20px;margin:0 0 12px;">Sessão agendada 📅</h1>
        <p style="color:#888899;font-size:14px;line-height:1.7;margin:0 0 24px;">
          Olá <strong style="color:#e8e8f0;">${data.clientName}</strong>, a tua sessão foi marcada:
        </p>
        <table style="background:#0d0d13;border:1px solid #2a2a35;border-radius:8px;padding:20px;width:100%;box-sizing:border-box;">
          <tr>
            <td style="color:#666677;font-size:11px;font-family:monospace;letter-spacing:1px;padding-bottom:8px;">TIPO</td>
            <td style="color:#c8f542;font-size:13px;font-weight:600;padding-bottom:8px;">${typeLabel[data.type] ?? data.type}</td>
          </tr>
          <tr>
            <td style="color:#666677;font-size:11px;font-family:monospace;letter-spacing:1px;padding-bottom:8px;">DATA</td>
            <td style="color:#e8e8f0;font-size:13px;padding-bottom:8px;text-transform:capitalize;">${data.date}</td>
          </tr>
          <tr>
            <td style="color:#666677;font-size:11px;font-family:monospace;letter-spacing:1px;padding-bottom:8px;">HORA</td>
            <td style="color:#e8e8f0;font-size:13px;padding-bottom:8px;">${data.time}</td>
          </tr>
          <tr>
            <td style="color:#666677;font-size:11px;font-family:monospace;letter-spacing:1px;">DURAÇÃO</td>
            <td style="color:#e8e8f0;font-size:13px;">${data.duration} min</td>
          </tr>
        </table>
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
