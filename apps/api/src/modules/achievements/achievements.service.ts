import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementType } from '@prisma/client';

const ACHIEVEMENT_META: Record<AchievementType, { name: string; icon: string; description: string }> = {
  FIRST_WORKOUT:      { name: 'Primeiro treino',     icon: '🎯', description: 'Completaste o teu primeiro treino!' },
  STREAK_3:           { name: 'Streak de 3 dias',    icon: '🔥', description: '3 dias seguidos de treino!' },
  STREAK_7:           { name: 'Semana perfeita',     icon: '⚡', description: '7 dias seguidos de treino!' },
  STREAK_30:          { name: 'Mês de fogo',         icon: '🏆', description: '30 dias seguidos de treino!' },
  WORKOUTS_10:        { name: '10 Treinos',          icon: '💪', description: 'Completaste 10 treinos no total.' },
  WORKOUTS_50:        { name: '50 Treinos',          icon: '🌟', description: 'Completaste 50 treinos no total.' },
  WORKOUTS_100:       { name: '100 Treinos',         icon: '🎖️', description: 'Lenda! 100 treinos completados.' },
  FIRST_PR:           { name: 'Primeiro recorde',    icon: '📈', description: 'Bateste o teu primeiro recorde pessoal!' },
  PRS_5:              { name: '5 Recordes',          icon: '🏅', description: 'Bateste 5 recordes pessoais!' },
  CONSISTENCY_MONTH:  { name: 'Consistência',        icon: '📅', description: '20+ treinos num mês. Incrível!' },
};

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async checkAndAward(clientId: string): Promise<void> {
    const [metrics, prCount, existing] = await Promise.all([
      this.prisma.clientMetrics.findUnique({ where: { clientId } }),
      this.prisma.personalRecord.count({ where: { clientId } }),
      this.prisma.clientAchievement.findMany({ where: { clientId }, select: { type: true } }),
    ]);

    const earned = new Set(existing.map((a) => a.type));
    const toAward: AchievementType[] = [];

    const total = metrics?.totalWorkouts ?? 0;
    const streak = metrics?.workoutStreak ?? 0;

    if (total >= 1   && !earned.has('FIRST_WORKOUT'))  toAward.push('FIRST_WORKOUT');
    if (streak >= 3  && !earned.has('STREAK_3'))       toAward.push('STREAK_3');
    if (streak >= 7  && !earned.has('STREAK_7'))       toAward.push('STREAK_7');
    if (streak >= 30 && !earned.has('STREAK_30'))      toAward.push('STREAK_30');
    if (total >= 10  && !earned.has('WORKOUTS_10'))    toAward.push('WORKOUTS_10');
    if (total >= 50  && !earned.has('WORKOUTS_50'))    toAward.push('WORKOUTS_50');
    if (total >= 100 && !earned.has('WORKOUTS_100'))   toAward.push('WORKOUTS_100');
    if (prCount >= 1 && !earned.has('FIRST_PR'))       toAward.push('FIRST_PR');
    if (prCount >= 5 && !earned.has('PRS_5'))          toAward.push('PRS_5');

    // consistency: 20+ workouts this calendar month
    if (!earned.has('CONSISTENCY_MONTH')) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthWorkouts = await this.prisma.workoutLog.count({
        where: { clientId, date: { gte: monthStart } },
      });
      if (monthWorkouts >= 20) toAward.push('CONSISTENCY_MONTH');
    }

    if (toAward.length === 0) return;

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true },
    });

    for (const type of toAward) {
      try {
        await this.prisma.clientAchievement.create({ data: { clientId, type } });
        const meta = ACHIEVEMENT_META[type];
        await this.notifications.sendToUser(client!.userId, {
          title: `${meta.icon} Conquista desbloqueada!`,
          body:  meta.name,
          url:   '/client/achievements',
        });
        this.logger.log(`Achievement ${type} awarded to client ${clientId}`);
      } catch {
        // unique constraint = already awarded, ignore
      }
    }
  }

  async findForClient(clientId: string) {
    const achievements = await this.prisma.clientAchievement.findMany({
      where: { clientId },
      orderBy: { earnedAt: 'desc' },
    });
    return achievements.map((a) => ({
      ...a,
      ...ACHIEVEMENT_META[a.type],
    }));
  }

  async findMy(userId: string) {
    const client = await this.prisma.client.findFirst({ where: { userId } });
    if (!client) return [];
    return this.findForClient(client.id);
  }
}
