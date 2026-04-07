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
}
