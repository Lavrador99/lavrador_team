import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Dashboard global (PT) ──────────────────────────────────────────────

  async getDashboardStats() {
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalClients,
      activePrograms,
      sessionsThisWeek,
      sessionsThisMonth,
      completedThisMonth,
      cancelledThisMonth,
      newClientsThisMonth,
      allSessions,
      recentAssessments,
      recentPrograms,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: "CLIENT" } }),
      this.prisma.program.count({ where: { status: "ACTIVE" } }),
      this.prisma.session.count({
        where: { scheduledAt: { gte: startOfWeek } },
      }),
      this.prisma.session.count({
        where: { scheduledAt: { gte: startOfMonth } },
      }),
      this.prisma.session.count({
        where: { scheduledAt: { gte: startOfMonth }, status: "COMPLETED" },
      }),
      this.prisma.session.count({
        where: {
          scheduledAt: { gte: startOfMonth },
          status: { in: ["CANCELLED", "NO_SHOW"] },
        },
      }),
      this.prisma.user.count({
        where: { role: "CLIENT", createdAt: { gte: startOfMonth } },
      }),
      this.prisma.session.findMany({
        where: {
          scheduledAt: {
            gte: new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: { scheduledAt: true, status: true, type: true },
      }),
      this.prisma.assessment.findMany({
        where: { createdAt: { gte: startOfLastMonth } },
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.program.findMany({
        where: { createdAt: { gte: startOfLastMonth } },
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const attendanceRate =
      sessionsThisMonth > 0
        ? Math.round((completedThisMonth / sessionsThisMonth) * 100)
        : 0;

    // Sessões agrupadas por semana (últimas 8 semanas)
    const sessionsByWeek = buildWeeklyBuckets(allSessions, 8);

    // Distribuição por tipo
    const typeMap: Record<string, number> = {};
    allSessions.forEach((s) => {
      typeMap[s.type] = (typeMap[s.type] ?? 0) + 1;
    });
    const sessionsByType = Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
    }));

    // Actividade recente
    const recentActivity = [
      ...recentAssessments.map((a) => ({
        clientId: a.clientId,
        clientName: (a as any).client?.name ?? "—",
        action: `Nova avaliação — nível ${a.level}`,
        date: a.createdAt.toISOString(),
      })),
      ...recentPrograms.map((p) => ({
        clientId: p.clientId,
        clientName: (p as any).client?.name ?? "—",
        action: `Plano criado — ${p.name}`,
        date: p.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);

    return {
      totalClients,
      activePrograms,
      sessionsThisWeek,
      sessionsThisMonth,
      attendanceRate,
      newClientsThisMonth,
      sessionsByWeek,
      sessionsByType,
      recentActivity,
    };
  }

  // ─── Stats do próprio cliente (resolve userId → clientId) ──────────────

  async getMyStats(userId: string) {
    const client = await this.prisma.client.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!client) return null;
    return this.getClientStats(client.id);
  }

  // ─── Progresso individual ───────────────────────────────────────────────

  async getClientStats(clientId: string) {
    const [client, sessions, assessments, programs, workoutLogs] = await Promise.all([
      this.prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true, name: true },
      }),
      this.prisma.session.findMany({
        where: { clientId },
        select: { scheduledAt: true, status: true, type: true },
        orderBy: { scheduledAt: "asc" },
      }),
      this.prisma.assessment.findMany({
        where: { clientId },
        select: { id: true, createdAt: true, level: true, flags: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.program.findMany({
        where: { clientId },
        select: { id: true, name: true, status: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.workoutLog.findMany({
        where: { clientId },
        select: { id: true, date: true, durationMin: true },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "COMPLETED").length;
    const cancelled = sessions.filter((s) => s.status === "CANCELLED").length;
    const noShow = sessions.filter((s) => s.status === "NO_SHOW").length;

    const attendanceRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const activeProgram =
      programs.find((p) => p.status === "ACTIVE")?.name ?? null;
    const currentLevel = assessments[0]?.level ?? "INICIANTE";

    const sessionHistory = buildWeeklyBuckets(sessions, 12);

    const assessmentHistory = assessments.map((a) => ({
      id: a.id,
      date: a.createdAt.toISOString(),
      level: a.level,
      flags: a.flags,
    }));

    return {
      clientId,
      clientName: client?.name ?? "—",
      totalSessions: total,
      completedSessions: completed,
      cancelledSessions: cancelled,
      noShowSessions: noShow,
      attendanceRate,
      currentLevel,
      totalPrograms: programs.length,
      activeProgram,
      assessmentHistory,
      sessionHistory,
      totalWorkoutLogs: workoutLogs.length > 0 ? await this.prisma.workoutLog.count({ where: { clientId } }) : 0,
      recentWorkoutLogs: workoutLogs.map((l) => ({
        id: l.id,
        date: l.date.toISOString(),
        durationMin: l.durationMin,
      })),
    };
  }

  // ─── Distribuição global de sessões ─────────────────────────────────────

  async getSessionsDistribution() {
    const sessions = await this.prisma.session.findMany({
      select: { scheduledAt: true, status: true, type: true },
    });

    const total = sessions.length || 1;

    const typeMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    const dayMap: Record<number, number> = {};
    const hourMap: Record<number, number> = {};

    const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    sessions.forEach((s) => {
      typeMap[s.type] = (typeMap[s.type] ?? 0) + 1;
      statusMap[s.status] = (statusMap[s.status] ?? 0) + 1;
      const d = new Date(s.scheduledAt);
      dayMap[d.getDay()] = (dayMap[d.getDay()] ?? 0) + 1;
      hourMap[d.getHours()] = (hourMap[d.getHours()] ?? 0) + 1;
    });

    return {
      byType: Object.entries(typeMap).map(([type, count]) => ({
        type,
        count,
        pct: Math.round((count / total) * 100),
      })),
      byStatus: Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
        pct: Math.round((count / total) * 100),
      })),
      byDayOfWeek: Object.entries(dayMap)
        .map(([day, count]) => ({
          day: DAY_LABELS[parseInt(day)],
          count,
        }))
        .sort((a, b) => DAY_LABELS.indexOf(a.day) - DAY_LABELS.indexOf(b.day)),
      byHour: Object.entries(hourMap)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
        }))
        .sort((a, b) => a.hour - b.hour),
    };
  }

  // ─── Actividade recente de todos os clientes ─────────────────────────────

  async getClientsActivity() {
    const clients = await this.prisma.client.findMany({
      include: {
        sessions: {
          orderBy: { scheduledAt: "desc" },
          take: 1,
          select: { scheduledAt: true, status: true },
        },
        programs: {
          where: { status: "ACTIVE" },
          take: 1,
          select: { name: true },
        },
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { level: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return clients.map((c) => ({
      clientId: c.id,
      name: c.name,
      lastSession: c.sessions[0]?.scheduledAt ?? null,
      lastSessionStatus: c.sessions[0]?.status ?? null,
      activeProgram: c.programs[0]?.name ?? null,
      level: c.assessments[0]?.level ?? null,
      lastAssessment: c.assessments[0]?.createdAt ?? null,
    }));
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeeklyBuckets(
  sessions: { scheduledAt: Date; status: string }[],
  numWeeks: number,
) {
  const now = new Date();
  const buckets: Record<
    string,
    { week: string; total: number; completed: number; cancelled: number }
  > = {};

  for (let i = numWeeks - 1; i >= 0; i--) {
    const weekStart = getStartOfWeek(
      new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000),
    );
    const label = weekStart.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
    });
    buckets[label] = { week: label, total: 0, completed: 0, cancelled: 0 };
  }

  sessions.forEach((s) => {
    const weekStart = getStartOfWeek(new Date(s.scheduledAt));
    const label = weekStart.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
    });
    if (buckets[label]) {
      buckets[label].total += 1;
      if (s.status === "COMPLETED") buckets[label].completed += 1;
      if (s.status === "CANCELLED" || s.status === "NO_SHOW")
        buckets[label].cancelled += 1;
    }
  });

  return Object.values(buckets);
}
