import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class StreakProtectionScheduler {
  private readonly logger = new Logger(StreakProtectionScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Todos os dias às 18h — alerta clientes com streak ≥ 3 que ainda não treinaram hoje
  @Cron('0 18 * * *')
  async alertStreakAtRisk() {
    this.logger.log('Verificando streaks em risco...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clientsAtRisk = await this.prisma.client.findMany({
      where: {
        metrics: {
          workoutStreak: { gte: 3 },
          lastWorkoutDate: { lt: today },
        },
      },
      include: {
        user: { select: { id: true } },
        metrics: { select: { workoutStreak: true } },
      },
    });

    let sent = 0;
    for (const client of clientsAtRisk) {
      const userId = (client.user as any)?.id;
      if (!userId) continue;

      const streak = client.metrics?.workoutStreak ?? 0;

      try {
        await this.notifications.sendToUser(userId, {
          title: '🔥 Streak em risco!',
          body: `${client.name}, treina hoje para manter o teu streak de ${streak} dias!`,
          url: '/client/my-plan',
        });
        sent++;
      } catch (err) {
        this.logger.warn(`Streak alert falhou para ${client.name}: ${(err as Error).message}`);
      }
    }

    this.logger.log(`Streak alerts enviados: ${sent}/${clientsAtRisk.length}`);
  }
}
