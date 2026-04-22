import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProgressionScheduler {
  private readonly logger = new Logger(ProgressionScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Run weekly on Sunday at 20:00
  @Cron('0 20 * * 0')
  async detectProgressionOpportunities() {
    const clients = await this.prisma.client.findMany({
      select: { id: true, name: true },
    });

    for (const client of clients) {
      await this.checkProgression(client.id, client.name).catch(() => {});
    }
  }

  // Run weekly on Sunday at 20:30
  @Cron('30 20 * * 0')
  async detectDeloadNeeds() {
    const clients = await this.prisma.client.findMany({
      select: { id: true, name: true },
    });

    for (const client of clients) {
      await this.checkDeload(client.id, client.name).catch(() => {});
    }
  }

  private async checkProgression(clientId: string, clientName: string) {
    // Get last 6 workout logs
    const recentLogs = await this.prisma.workoutLog.findMany({
      where: { clientId },
      orderBy: { date: 'desc' },
      take: 6,
      select: { entries: true, date: true },
    });

    if (recentLogs.length < 2) return;

    // Group by exercise, look for 2+ consecutive sessions where all sets hit target reps
    const exerciseMap = new Map<string, { hitTarget: boolean; date: Date }[]>();

    for (const log of recentLogs) {
      const entries = (log.entries as any[]) ?? [];
      for (const entry of entries) {
        const name = entry.exerciseName as string;
        if (!name) continue;

        const allSetsCompleted = (entry.sets ?? []).every((s: any) => {
          const targetReps = s.targetReps ?? s.reps;
          const actualReps = s.reps;
          return s.completed && actualReps >= targetReps;
        });

        if (!exerciseMap.has(name)) exerciseMap.set(name, []);
        exerciseMap.get(name)!.push({ hitTarget: allSetsCompleted, date: log.date });
      }
    }

    const readyToProgress: string[] = [];
    for (const [exercise, history] of exerciseMap.entries()) {
      // Sort by date desc (most recent first)
      const sorted = history.sort((a, b) => b.date.getTime() - a.date.getTime());
      // 2+ consecutive sessions hitting all targets
      if (sorted.length >= 2 && sorted[0].hitTarget && sorted[1].hitTarget) {
        readyToProgress.push(exercise);
      }
    }

    if (readyToProgress.length === 0) return;

    const ptUser = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!ptUser) return;

    await this.notifications.sendToUser(ptUser.id, {
      title: '📈 Progressão disponível',
      body: `${clientName}: ${readyToProgress.slice(0, 3).join(', ')} ${readyToProgress.length > 3 ? `+${readyToProgress.length - 3}` : ''} — pronto(a) para aumentar carga`,
      url: `/clients/${clientId}`,
    });

    this.logger.log(`Progression opportunities for ${clientName}: ${readyToProgress.join(', ')}`);
  }

  private async checkDeload(clientId: string, clientName: string) {
    const metrics = await this.prisma.clientMetrics.findUnique({ where: { clientId } });
    if (!metrics?.lastWorkoutDate) return;

    // Get workout logs from last 4 weeks
    const fourWeeksAgo = new Date(Date.now() - 28 * 86400_000);
    const recentLogs = await this.prisma.workoutLog.findMany({
      where: { clientId, date: { gte: fourWeeksAgo } },
      orderBy: { date: 'asc' },
      select: { entries: true, date: true },
    });

    if (recentLogs.length < 8) return; // need enough data

    // Check if volume has stagnated over last 4 weeks (split into 2 blocks of 2 weeks)
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400_000);
    const block1Logs = recentLogs.filter((l) => l.date < twoWeeksAgo);
    const block2Logs = recentLogs.filter((l) => l.date >= twoWeeksAgo);

    if (block1Logs.length === 0 || block2Logs.length === 0) return;

    const calcVolume = (logs: typeof recentLogs) =>
      logs.reduce((total, log) => {
        const entries = (log.entries as any[]) ?? [];
        return total + entries.reduce((logTotal, entry) => {
          return logTotal + (entry.sets ?? []).reduce((setTotal: number, s: any) => {
            return setTotal + (s.completed ? (s.load ?? 0) * (s.reps ?? 0) : 0);
          }, 0);
        }, 0);
      }, 0);

    const vol1 = calcVolume(block1Logs) / block1Logs.length;
    const vol2 = calcVolume(block2Logs) / block2Logs.length;

    // Volume stagnated or declined for 4 weeks → suggest deload
    const changePercent = vol1 > 0 ? ((vol2 - vol1) / vol1) * 100 : 0;
    if (changePercent > -5) return; // still progressing, skip

    const ptUser = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!ptUser) return;

    await this.notifications.sendToUser(ptUser.id, {
      title: '⚠️ Semana de deload recomendada',
      body: `${clientName}: volume caiu ${Math.abs(Math.round(changePercent))}% nas últimas 2 semanas. Considera prescrever deload.`,
      url: `/clients/${clientId}`,
    });

    this.logger.log(`Deload suggested for ${clientName} (volume change: ${changePercent.toFixed(1)}%)`);
  }
}
