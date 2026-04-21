import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from './notifications.service';

// Todos as sextas-feiras às 17h00
const WEEKLY_CHECKIN_CRON = '0 17 * * 5';

@Injectable()
export class CheckinScheduler {
  private readonly logger = new Logger(CheckinScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(WEEKLY_CHECKIN_CRON)
  async sendWeeklyCheckins() {
    this.logger.log('Iniciando check-ins semanais...');

    const clients = await this.prisma.client.findMany({
      where: {
        programs: { some: { status: 'ACTIVE' } },
      },
      include: {
        user: { select: { id: true, email: true } },
        metrics: { select: { lastWorkoutDate: true, workoutStreak: true, totalWorkouts: true } },
      },
    });

    let sent = 0;
    for (const client of clients) {
      const userId = (client.user as any)?.id;
      const email  = (client.user as any)?.email;
      if (!email || !userId) continue;

      const streak = client.metrics?.workoutStreak ?? 0;
      const total  = client.metrics?.totalWorkouts ?? 0;

      try {
        // Push notification
        await this.notificationsService.sendToUser(userId, {
          title: 'Check-in semanal 💪',
          body:  `Como correu esta semana, ${client.name}? Partilha com o teu PT!`,
          url:   '/client/messages',
        });

        // Email fallback
        await this.emailService.sendCheckinEmail(email, {
          clientName:   client.name ?? 'Cliente',
          streak,
          totalWorkouts: total,
          checkinUrl:   `${process.env.PLATFORM_URL ?? 'http://localhost:3000'}/client/messages`,
        });

        sent++;
      } catch (err) {
        this.logger.warn(`Check-in falhou para ${client.name}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Check-ins enviados: ${sent}/${clients.length}`);
  }
}
