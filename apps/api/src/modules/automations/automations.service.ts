import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AutomationTrigger } from '@prisma/client';

interface SequenceStep {
  delayDays: number;
  message: string;
  pushTitle?: string;
  pushBody?: string;
}

const SEQUENCES: Record<AutomationTrigger, SequenceStep[]> = {
  ONBOARDING_COMPLETE: [
    {
      delayDays: 0,
      message: 'Olá! Bem-vindo(a) ao programa. O teu personal trainer vai preparar o teu plano de treino personalizado em breve. Qualquer dúvida, fala comigo aqui! 💪',
      pushTitle: 'Bem-vindo(a)!',
      pushBody: 'A tua jornada começa agora. Consulta o teu plano.',
    },
    {
      delayDays: 3,
      message: 'Como estás a sentir? Já tiveste tempo de ver o teu plano de treino? Se tiveres alguma dúvida sobre os exercícios, não hesites em perguntar!',
    },
    {
      delayDays: 7,
      message: 'Passada uma semana — como correu? Registar os teus treinos na app ajuda-me a ajustar o plano para tires o máximo proveito. Continua assim! 🔥',
    },
  ],
  INACTIVITY_7_DAYS: [
    {
      delayDays: 0,
      message: 'Notei que não treinas há uns dias. Está tudo bem? Se precisares de ajustar o plano ou tiveres algum impedimento, fala comigo — estou aqui para ajudar.',
      pushTitle: 'Sentimos a tua falta!',
      pushBody: 'Há 7 dias sem treino. O teu PT quer saber como estás.',
    },
  ],
  STREAK_BROKEN: [
    {
      delayDays: 0,
      message: 'O teu streak foi interrompido, mas não desanimes! Cada sessão conta. Volta quando estiveres pronto(a) — o teu plano está à tua espera. 💪',
      pushTitle: 'Streak interrompido',
      pushBody: 'Não desistas! Retoma o teu treino hoje.',
    },
  ],
};

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MessagesService,
    private readonly notifications: NotificationsService,
  ) {}

  async trigger(clientId: string, trigger: AutomationTrigger): Promise<void> {
    // don't re-trigger same sequence if already active
    const existing = await this.prisma.automationRun.findFirst({
      where: { clientId, trigger, completedAt: null },
    });
    if (existing) return;

    const steps = SEQUENCES[trigger];
    if (!steps?.length) return;

    const firstStep = steps[0];
    const now = new Date();
    const nextRunAt = steps[1]
      ? new Date(now.getTime() + steps[1].delayDays * 86400_000)
      : null;

    await this.prisma.automationRun.create({
      data: {
        clientId,
        trigger,
        step: 0,
        nextRunAt,
        completedAt: steps.length === 1 ? now : null,
      },
    });

    await this.sendStep(clientId, trigger, 0);
  }

  private async sendStep(clientId: string, trigger: AutomationTrigger, stepIdx: number) {
    const step = SEQUENCES[trigger][stepIdx];
    if (!step) return;

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      include: { user: true },
    });
    if (!client) return;

    // Find the PT who manages this client (admin user with messages to this client)
    const ptUser = await this.prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!ptUser) return;

    await this.messages.send(ptUser.id, client.userId, step.message);

    if (step.pushTitle) {
      await this.notifications.sendToUser(client.userId, {
        title: step.pushTitle,
        body: step.pushBody ?? '',
        url: '/client/messages',
      });
    }
  }

  // Daily 08:00 — check for clients inactive 7+ days and trigger automation
  @Cron('0 8 * * *')
  async checkInactiveClients() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000);
    const inactiveMetrics = await this.prisma.clientMetrics.findMany({
      where: {
        OR: [
          { lastWorkoutDate: { lt: sevenDaysAgo } },
          { lastWorkoutDate: null },
        ],
        totalWorkouts: { gte: 3 }, // only fire if they've trained before (not brand new)
      },
      select: { clientId: true },
    });

    for (const { clientId } of inactiveMetrics) {
      await this.trigger(clientId, 'INACTIVITY_7_DAYS').catch(() => {});
    }
  }

  @Cron('0 10 * * *') // daily 10:00
  async processPendingAutomations() {
    const now = new Date();
    const pending = await this.prisma.automationRun.findMany({
      where: {
        completedAt: null,
        nextRunAt: { lte: now },
      },
    });

    for (const run of pending) {
      const nextStep = run.step + 1;
      const steps = SEQUENCES[run.trigger];

      await this.sendStep(run.clientId, run.trigger, nextStep);

      const hasMoreSteps = nextStep + 1 < steps.length;
      const nextRunAt = hasMoreSteps
        ? new Date(now.getTime() + steps[nextStep + 1].delayDays * 86400_000)
        : null;

      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          step: nextStep,
          nextRunAt,
          completedAt: !hasMoreSteps ? now : null,
        },
      });

      this.logger.log(`Automation ${run.trigger} step ${nextStep} sent to client ${run.clientId}`);
    }
  }
}
