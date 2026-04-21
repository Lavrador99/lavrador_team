import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { welcomeTemplate } from './templates/welcome';
import { sessionReminderTemplate } from './templates/session-reminder';
import { planUpdatedTemplate } from './templates/plan-updated';
import { inactivityAlertTemplate } from './templates/inactivity-alert';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from = 'Lavrador Team <noreply@lavradorteam.pt>';
  private readonly enabled: boolean;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.enabled = !!apiKey && apiKey !== 'DISABLED';
    this.resend = this.enabled ? new Resend(apiKey!) : null;

    if (!this.enabled) {
      this.logger.warn('RESEND_API_KEY not set — emails are disabled (add it to .env to enable)');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.enabled || !this.resend) {
      this.logger.debug(`[EMAIL SKIPPED] to=${to} subject="${subject}"`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err?.message}`);
    }
  }

  async sendWelcome(to: string, name: string) {
    const { subject, html } = welcomeTemplate(name);
    return this.send(to, subject, html);
  }

  async sendSessionReminder(to: string, data: {
    clientName: string;
    date: string;
    time: string;
    duration: number;
    type: string;
  }) {
    const { subject, html } = sessionReminderTemplate(data);
    return this.send(to, subject, html);
  }

  async sendPlanUpdated(to: string, data: {
    clientName: string;
    planName: string;
  }) {
    const { subject, html } = planUpdatedTemplate(data);
    return this.send(to, subject, html);
  }

  async sendInactivityAlert(to: string, data: {
    adminName: string;
    inactiveClients: { name: string; daysSinceLast: number }[];
  }) {
    const { subject, html } = inactivityAlertTemplate(data);
    return this.send(to, subject, html);
  }

  async sendCheckinEmail(to: string, data: {
    clientName: string;
    streak: number;
    totalWorkouts: number;
    checkinUrl: string;
  }) {
    const streakMsg = data.streak > 0 ? `🔥 ${data.streak} dias consecutivos!` : '';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#0a0a0f;color:#f4f4f5;border-radius:16px;">
        <h2 style="color:#c8f542;margin-bottom:8px;">Check-in semanal 💪</h2>
        <p style="color:#a1a1aa;">Olá, <strong style="color:#fff;">${data.clientName}</strong>!</p>
        <p style="color:#a1a1aa;">Como correu esta semana de treino? ${streakMsg}</p>
        ${data.totalWorkouts > 0 ? `<p style="color:#a1a1aa;">Tens <strong style="color:#84d4d3;">${data.totalWorkouts} treinos</strong> no total — continua assim!</p>` : ''}
        <p style="color:#a1a1aa;">Partilha as tuas sensações com o teu PT:</p>
        <a href="${data.checkinUrl}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#c8f542;color:#0a0a0f;font-weight:700;border-radius:12px;text-decoration:none;">
          Abrir mensagens →
        </a>
        <p style="margin-top:24px;font-size:11px;color:#52525b;">Lavrador Team · A tua plataforma de personal training</p>
      </div>`;

    return this.send(to, `${data.clientName}, como correu a semana? 💪`, html);
  }
}
