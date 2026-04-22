import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AutomationsService } from '../automations/automations.service';
import * as bcrypt from 'bcrypt';

export interface OnboardingIntakeDto {
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  // PAR-Q health questions
  hasHeartCondition: boolean;
  hasChestPain: boolean;
  hasDizziness: boolean;
  hasJointProblem: boolean;
  hasHighBloodPressure: boolean;
  otherHealthConditions?: string;
  // Goals
  primaryGoal: string;
  currentActivityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE';
  trainingFrequencyPerWeek: number;
  // Consent
  consentSigned: boolean;
  consentSignatureName: string;
}

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly automations: AutomationsService,
  ) {}

  async generateToken(ptUserId: string, clientName?: string, clientEmail?: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const record = await this.prisma.onboardingToken.create({
      data: {
        ptUserId,
        clientName,
        clientEmail,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL ?? process.env.PLATFORM_URL ?? 'http://localhost:3000';
    return {
      token: record.token,
      url: `${appUrl}/onboarding/${record.token}`,
      expiresAt: record.expiresAt,
    };
  }

  async getTokenInfo(token: string) {
    const record = await this.prisma.onboardingToken.findUnique({
      where: { token },
      include: { pt: { select: { id: true } } },
    });

    if (!record) throw new NotFoundException('Link de onboarding inválido');
    if (record.usedAt) throw new BadRequestException('Este link já foi utilizado');
    if (record.expiresAt < new Date()) throw new BadRequestException('Este link expirou');

    return {
      clientName: record.clientName,
      clientEmail: record.clientEmail,
    };
  }

  async submitIntake(token: string, data: OnboardingIntakeDto) {
    const record = await this.prisma.onboardingToken.findUnique({
      where: { token },
      include: { pt: { select: { id: true } } },
    });

    if (!record) throw new NotFoundException('Link de onboarding inválido');
    if (record.usedAt) throw new BadRequestException('Este link já foi utilizado');
    if (record.expiresAt < new Date()) throw new BadRequestException('Este link expirou');
    if (!data.consentSigned) throw new BadRequestException('É necessário assinar o consentimento');

    // Check email not already registered
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Este email já está registado');

    const tempPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6).toUpperCase();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Build clinical flags from PAR-Q
    const flags: string[] = [];
    if (data.hasHeartCondition) flags.push('cardiovascular_risk');
    if (data.hasHighBloodPressure) flags.push('hipertensao');
    if (data.hasJointProblem) flags.push('dor_joelho');
    if (data.currentActivityLevel === 'SEDENTARY') flags.push('sedentario');

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: 'CLIENT',
        },
      });

      const client = await tx.client.create({
        data: {
          userId: user.id,
          name: data.name,
          phone: data.phone,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          notes: [
            data.primaryGoal && `Objetivo: ${data.primaryGoal}`,
            data.otherHealthConditions && `Condições de saúde: ${data.otherHealthConditions}`,
            `Treinos/semana desejados: ${data.trainingFrequencyPerWeek}`,
            `Assinatura: ${data.consentSignatureName}`,
          ].filter(Boolean).join('\n') || undefined,
        },
      });

      await tx.onboardingToken.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      return { user, client, flags };
    });

    // Notify PT
    try {
      await this.notifications.sendToUser(record.ptUserId, {
        title: '🆕 Novo cliente!',
        body: `${data.name} completou o intake e está pronto para começar.`,
        url: `/clients/${result.client.id}`,
      });
    } catch {
      // non-critical
    }

    // Trigger welcome automation sequence (fire-and-forget)
    this.automations.trigger(result.client.id, 'ONBOARDING_COMPLETE').catch(() => {});

    return {
      clientId: result.client.id,
      flags,
      message: 'Bem-vindo/a! Vai receber as credenciais de acesso por email em breve.',
    };
  }
}
