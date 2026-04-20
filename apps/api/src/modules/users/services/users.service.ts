import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "../repositories/users.repository";
import { ClientsRepository } from "../repositories/clients.repository";
import { UpdateProfileDto } from "../types/users.dto";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly clientsRepository: ClientsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException("Utilizador não encontrado");
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async getAllClients() {
    const users = await this.usersRepository.findAllClients();
    return users.map(({ passwordHash, ...u }) => u);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException("Utilizador não encontrado");

    return this.usersRepository.updateClient(userId, {
      name: dto.name,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      phone: dto.phone,
      notes: dto.notes,
    });
  }

  async getClientDetail(clientId: string) {
    return this.clientsRepository.findDetailById(clientId);
  }

  async getClientTimeline(clientId: string, limit = 30) {
    const [sessions, assessments, workoutLogs, personalRecords] = await Promise.all([
      this.prisma.session.findMany({
        where: { clientId },
        orderBy: { scheduledAt: 'desc' },
        take: limit,
        select: { id: true, scheduledAt: true, type: true, status: true, notes: true },
      }),
      this.prisma.assessment.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, createdAt: true, level: true, flags: true },
      }),
      this.prisma.workoutLog.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: limit,
        select: { id: true, date: true, durationMin: true, rpe: true, workout: { select: { name: true } } },
      }),
      this.prisma.personalRecord.findMany({
        where: { clientId },
        orderBy: { recordedAt: 'desc' },
        take: 10,
        select: { id: true, exerciseName: true, type: true, value: true, recordedAt: true },
      }),
    ]);

    type TimelineEvent = {
      id: string;
      date: string;
      type: 'SESSION' | 'ASSESSMENT' | 'WORKOUT_LOG' | 'PERSONAL_RECORD';
      title: string;
      subtitle?: string;
      badge?: string;
    };

    const events: TimelineEvent[] = [
      ...sessions.map((s) => ({
        id: s.id,
        date: s.scheduledAt.toISOString(),
        type: 'SESSION' as const,
        title: `Sessão ${s.type.toLowerCase().replace('_', ' ')}`,
        subtitle: s.notes ?? undefined,
        badge: s.status,
      })),
      ...assessments.map((a) => ({
        id: a.id,
        date: a.createdAt.toISOString(),
        type: 'ASSESSMENT' as const,
        title: `Avaliação — nível ${a.level}`,
        subtitle: a.flags.length ? `Flags: ${a.flags.slice(0, 3).join(', ')}` : undefined,
        badge: a.level,
      })),
      ...workoutLogs.map((w) => ({
        id: w.id,
        date: w.date.toISOString(),
        type: 'WORKOUT_LOG' as const,
        title: `Treino: ${(w as any).workout?.name ?? 'Sem nome'}`,
        subtitle: [w.durationMin ? `${w.durationMin} min` : null, w.rpe ? `RPE ${w.rpe}` : null].filter(Boolean).join(' · ') || undefined,
      })),
      ...personalRecords.map((pr) => ({
        id: pr.id,
        date: pr.recordedAt.toISOString(),
        type: 'PERSONAL_RECORD' as const,
        title: `PR: ${pr.exerciseName}`,
        subtitle: `${pr.value} ${pr.type === 'WEIGHT_KG' ? 'kg' : pr.type === 'REPS_MAX' ? 'reps' : pr.type.toLowerCase()}`,
        badge: 'PR',
      })),
    ];

    return events
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getClientClinicalSummary(clientId: string) {
    const latestAssessment = await this.prisma.assessment.findFirst({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, level: true, flags: true, data: true },
    });

    if (!latestAssessment) return null;

    const data = latestAssessment.data as Record<string, unknown> | null;
    const personal = data?.pessoal as Record<string, unknown> | undefined;
    const sports = data?.desporto as Record<string, unknown> | undefined;

    return {
      assessmentId: latestAssessment.id,
      assessmentDate: latestAssessment.createdAt.toISOString(),
      level: latestAssessment.level,
      flags: latestAssessment.flags,
      lesoes: sports?.lesoes ?? null,
      objetivo: sports?.objetivo ?? null,
      diasSemana: sports?.diasSemana ?? null,
      pas: personal?.PAS ?? null,
      pad: personal?.PAD ?? null,
    };
  }
}
