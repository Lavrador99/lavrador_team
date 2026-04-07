import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HabitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHabit(data: { clientId: string; name: string; icon?: string; frequency?: string }) {
    return this.prisma.habit.create({ data });
  }

  async findByClient(clientId: string) {
    return this.prisma.habit.findMany({
      where: { clientId, isActive: true },
      include: {
        logs: {
          where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
          orderBy: { date: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateHabit(id: string, data: { name?: string; icon?: string; isActive?: boolean }) {
    return this.prisma.habit.update({ where: { id }, data });
  }

  async deleteHabit(id: string) {
    return this.prisma.habit.delete({ where: { id } });
  }

  async logHabit(habitId: string, date: Date, completed = true) {
    return this.prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, date, completed },
      update: { completed },
    });
  }

  async getLogsForPeriod(clientId: string, from: Date, to: Date) {
    return this.prisma.habitLog.findMany({
      where: {
        habit: { clientId },
        date: { gte: from, lte: to },
      },
      include: { habit: { select: { id: true, name: true, icon: true } } },
      orderBy: { date: 'asc' },
    });
  }

  async getWeeklyAdherence(clientId: string) {
    const from = new Date();
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);

    const habits = await this.findByClient(clientId);
    const logs = await this.getLogsForPeriod(clientId, from, new Date());

    const completedSet = new Set(logs.filter((l) => l.completed).map((l) => `${l.habitId}_${l.date.toDateString()}`));

    const totalPossible = habits.length * 7;
    const totalDone = completedSet.size;
    const adherencePct = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

    return { adherencePct, totalHabits: habits.length, completedThisWeek: totalDone };
  }
}
