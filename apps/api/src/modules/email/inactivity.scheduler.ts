import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

const INACTIVITY_DAYS = 7;

@Injectable()
export class InactivityScheduler {
  private readonly logger = new Logger(InactivityScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /** Runs every day at 08:00 */
  @Cron('0 8 * * *')
  async checkInactiveClients() {
    this.logger.log('Running inactivity check...');

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - INACTIVITY_DAYS);

    // Get all active clients with their last workout log
    const clients = await this.prisma.client.findMany({
      include: {
        user: { select: { email: true } },
        workoutLogs: {
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
        programs: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: { id: true },
        },
      },
    });

    // Only flag clients that have an active program but haven't logged recently
    const inactive = clients
      .filter((c) => c.programs.length > 0)
      .filter((c) => {
        const lastLog = c.workoutLogs[0]?.date;
        if (!lastLog) return true; // Never logged
        return lastLog < threshold;
      })
      .map((c) => {
        const lastLog = c.workoutLogs[0]?.date;
        const daysSinceLast = lastLog
          ? Math.floor((Date.now() - lastLog.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        return { name: c.name, daysSinceLast };
      });

    if (inactive.length === 0) {
      this.logger.log('No inactive clients found.');
      return;
    }

    // Get all admins
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    });

    for (const admin of admins) {
      await this.emailService.sendInactivityAlert(admin.email, {
        adminName: 'Treinador',
        inactiveClients: inactive,
      });
    }

    this.logger.log(`Inactivity alert sent: ${inactive.length} clients, ${admins.length} admins notified.`);
  }
}
