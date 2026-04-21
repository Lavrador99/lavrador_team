import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class SessionReminderScheduler {
  private readonly logger = new Logger(SessionReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Todos os dias às 9h — lembra clientes de sessões agendadas para amanhã
  @Cron('0 9 * * *')
  async remindUpcomingSessions() {
    this.logger.log('Enviando lembretes de sessão...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = new Date(tomorrow);
    start.setHours(0, 0, 0, 0);
    const end = new Date(tomorrow);
    end.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.session.findMany({
      where: {
        scheduledAt: { gte: start, lte: end },
        status: 'SCHEDULED',
      },
      include: {
        client: {
          include: {
            user: { select: { id: true } },
          },
        },
      },
    });

    let sent = 0;
    for (const session of sessions) {
      const userId = (session.client.user as any)?.id;
      if (!userId) continue;

      const time = session.scheduledAt.toLocaleTimeString('pt-PT', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Lisbon',
      });

      const typeLabel: Record<string, string> = {
        TRAINING: 'Treino',
        ASSESSMENT: 'Avaliação',
        FOLLOWUP: 'Follow-up',
      };

      try {
        await this.notifications.sendToUser(userId, {
          title: '📅 Sessão amanhã!',
          body: `${typeLabel[session.type] ?? 'Sessão'} amanhã às ${time}. Prepara-te!`,
          url: '/client/stats',
        });
        sent++;
      } catch (err) {
        this.logger.warn(`Session reminder falhou para ${session.client.name}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Session reminders enviados: ${sent}/${sessions.length}`);
  }
}
