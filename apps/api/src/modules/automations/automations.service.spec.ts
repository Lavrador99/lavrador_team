import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AutomationsService } from './automations.service';

describe('AutomationsService', () => {
  let service: AutomationsService;
  let prisma: jest.Mocked<PrismaService>;
  let messages: jest.Mocked<MessagesService>;
  let notifications: jest.Mocked<NotificationsService>;

  const mockPrisma = {
    automationRun: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    clientMetrics: {
      findMany: jest.fn(),
    },
  };

  const mockMessages = {
    send: jest.fn(),
  };

  const mockNotifications = {
    sendToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MessagesService, useValue: mockMessages },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AutomationsService>(AutomationsService);
    prisma = module.get(PrismaService);
    messages = module.get(MessagesService);
    notifications = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── trigger ─────────────────────────────────────────────────────────────

  describe('trigger', () => {
    const clientId = 'client-1';

    it('does nothing when an active automation run already exists', async () => {
      mockPrisma.automationRun.findFirst.mockResolvedValue({ id: 'run-1' });

      await service.trigger(clientId, 'ONBOARDING_COMPLETE');

      expect(mockPrisma.automationRun.create).not.toHaveBeenCalled();
    });

    it('creates an automation run and sends step 0 on first trigger', async () => {
      mockPrisma.automationRun.findFirst.mockResolvedValue(null);
      mockPrisma.automationRun.create.mockResolvedValue({ id: 'run-1' });
      mockPrisma.client.findUnique.mockResolvedValue({
        id: clientId,
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockMessages.send.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.trigger(clientId, 'ONBOARDING_COMPLETE');

      expect(mockPrisma.automationRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientId, trigger: 'ONBOARDING_COMPLETE', step: 0 }),
        }),
      );
      expect(mockMessages.send).toHaveBeenCalledWith(
        'pt-1',
        'user-1',
        expect.stringContaining('Bem-vindo'),
      );
    });

    it('marks run as completed immediately when trigger has only 1 step', async () => {
      mockPrisma.automationRun.findFirst.mockResolvedValue(null);
      mockPrisma.automationRun.create.mockResolvedValue({ id: 'run-1' });
      mockPrisma.client.findUnique.mockResolvedValue({
        id: clientId,
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockMessages.send.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.trigger(clientId, 'INACTIVITY_7_DAYS');

      // INACTIVITY_7_DAYS has only 1 step, so completedAt should be set
      expect(mockPrisma.automationRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });

    it('sends a push notification for step 0 that has pushTitle defined', async () => {
      mockPrisma.automationRun.findFirst.mockResolvedValue(null);
      mockPrisma.automationRun.create.mockResolvedValue({ id: 'run-1' });
      mockPrisma.client.findUnique.mockResolvedValue({
        id: clientId,
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockMessages.send.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.trigger(clientId, 'ONBOARDING_COMPLETE');

      expect(mockNotifications.sendToUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ title: 'Bem-vindo(a)!' }),
      );
    });
  });

  // ─── checkInactiveClients ─────────────────────────────────────────────────

  describe('checkInactiveClients', () => {
    it('triggers INACTIVITY_7_DAYS for each inactive client', async () => {
      mockPrisma.clientMetrics.findMany.mockResolvedValue([
        { clientId: 'client-1' },
        { clientId: 'client-2' },
      ]);
      // Each trigger call: findFirst returns null (no existing), create succeeds, sendStep succeeds
      mockPrisma.automationRun.findFirst.mockResolvedValue({ id: 'existing' }); // already triggered, so no-op

      await service.checkInactiveClients();

      expect(mockPrisma.clientMetrics.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ totalWorkouts: { gte: 3 } }),
        }),
      );
      // trigger was called for both clients (even if it no-ops due to existing run)
      expect(mockPrisma.automationRun.findFirst).toHaveBeenCalledTimes(2);
    });

    it('does not throw when trigger fails for a client', async () => {
      mockPrisma.clientMetrics.findMany.mockResolvedValue([{ clientId: 'client-1' }]);
      mockPrisma.automationRun.findFirst.mockRejectedValue(new Error('DB error'));

      await expect(service.checkInactiveClients()).resolves.not.toThrow();
    });
  });

  // ─── processPendingAutomations ────────────────────────────────────────────

  describe('processPendingAutomations', () => {
    it('processes each pending automation run and advances the step', async () => {
      const run = {
        id: 'run-1',
        clientId: 'client-1',
        trigger: 'ONBOARDING_COMPLETE' as const,
        step: 0,
      };
      mockPrisma.automationRun.findMany.mockResolvedValue([run]);
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 'client-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockMessages.send.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);
      mockPrisma.automationRun.update.mockResolvedValue({});

      await service.processPendingAutomations();

      expect(mockPrisma.automationRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'run-1' },
          data: expect.objectContaining({ step: 1 }),
        }),
      );
    });

    it('marks run as completed when there are no more steps after the next one', async () => {
      // ONBOARDING_COMPLETE has 3 steps (0,1,2); advancing from step 1 → step 2 is the last
      const run = {
        id: 'run-1',
        clientId: 'client-1',
        trigger: 'ONBOARDING_COMPLETE' as const,
        step: 1,
      };
      mockPrisma.automationRun.findMany.mockResolvedValue([run]);
      mockPrisma.client.findUnique.mockResolvedValue({
        id: 'client-1',
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'pt-1' });
      mockMessages.send.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);
      mockPrisma.automationRun.update.mockResolvedValue({});

      await service.processPendingAutomations();

      expect(mockPrisma.automationRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });

    it('does nothing when there are no pending runs', async () => {
      mockPrisma.automationRun.findMany.mockResolvedValue([]);

      await service.processPendingAutomations();

      expect(mockPrisma.automationRun.update).not.toHaveBeenCalled();
    });
  });
});
