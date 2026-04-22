import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AchievementsService } from './achievements.service';

describe('AchievementsService', () => {
  let service: AchievementsService;
  let prisma: jest.Mocked<PrismaService>;
  let notifications: jest.Mocked<NotificationsService>;

  const mockPrisma = {
    clientMetrics: {
      findUnique: jest.fn(),
    },
    personalRecord: {
      count: jest.fn(),
    },
    clientAchievement: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    workoutLog: {
      count: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockNotifications = {
    sendToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
    prisma = module.get(PrismaService);
    notifications = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAndAward', () => {
    const clientId = 'client-1';

    it('awards FIRST_WORKOUT when total >= 1 and not yet earned', async () => {
      mockPrisma.clientMetrics.findUnique.mockResolvedValue({
        clientId,
        totalWorkouts: 1,
        workoutStreak: 0,
      });
      mockPrisma.personalRecord.count.mockResolvedValue(0);
      mockPrisma.clientAchievement.findMany.mockResolvedValue([]);
      mockPrisma.workoutLog.count.mockResolvedValue(0);
      mockPrisma.client.findUnique.mockResolvedValue({
        id: clientId,
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.clientAchievement.create.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.checkAndAward(clientId);

      expect(mockPrisma.clientAchievement.create).toHaveBeenCalledWith({
        data: { clientId, type: 'FIRST_WORKOUT' },
      });
      expect(mockNotifications.sendToUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ title: expect.stringContaining('Conquista') }),
      );
    });

    it('does not re-award already earned achievements', async () => {
      mockPrisma.clientMetrics.findUnique.mockResolvedValue({
        clientId,
        totalWorkouts: 10,
        workoutStreak: 3,
      });
      mockPrisma.personalRecord.count.mockResolvedValue(0);
      mockPrisma.clientAchievement.findMany.mockResolvedValue([
        { type: 'FIRST_WORKOUT' },
        { type: 'STREAK_3' },
        { type: 'WORKOUTS_10' },
      ]);
      mockPrisma.workoutLog.count.mockResolvedValue(0);

      await service.checkAndAward(clientId);

      expect(mockPrisma.clientAchievement.create).not.toHaveBeenCalled();
    });

    it('awards STREAK_3, STREAK_7 when streak >= 7', async () => {
      mockPrisma.clientMetrics.findUnique.mockResolvedValue({
        clientId,
        totalWorkouts: 0,
        workoutStreak: 7,
      });
      mockPrisma.personalRecord.count.mockResolvedValue(0);
      mockPrisma.clientAchievement.findMany.mockResolvedValue([]);
      mockPrisma.workoutLog.count.mockResolvedValue(0);
      mockPrisma.client.findUnique.mockResolvedValue({
        id: clientId,
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.clientAchievement.create.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.checkAndAward(clientId);

      const createCalls = mockPrisma.clientAchievement.create.mock.calls.map(
        (c: any[]) => c[0].data.type,
      );
      expect(createCalls).toContain('STREAK_3');
      expect(createCalls).toContain('STREAK_7');
    });

    it('awards CONSISTENCY_MONTH when 20+ workouts this month', async () => {
      mockPrisma.clientMetrics.findUnique.mockResolvedValue({
        clientId,
        totalWorkouts: 0,
        workoutStreak: 0,
      });
      mockPrisma.personalRecord.count.mockResolvedValue(0);
      mockPrisma.clientAchievement.findMany.mockResolvedValue([]);
      mockPrisma.workoutLog.count.mockResolvedValue(20);
      mockPrisma.client.findUnique.mockResolvedValue({
        id: clientId,
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.clientAchievement.create.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.checkAndAward(clientId);

      const createCalls = mockPrisma.clientAchievement.create.mock.calls.map(
        (c: any[]) => c[0].data.type,
      );
      expect(createCalls).toContain('CONSISTENCY_MONTH');
    });

    it('returns early when no achievements to award', async () => {
      mockPrisma.clientMetrics.findUnique.mockResolvedValue({
        clientId,
        totalWorkouts: 0,
        workoutStreak: 0,
      });
      mockPrisma.personalRecord.count.mockResolvedValue(0);
      mockPrisma.clientAchievement.findMany.mockResolvedValue([]);
      mockPrisma.workoutLog.count.mockResolvedValue(0);

      await service.checkAndAward(clientId);

      expect(mockPrisma.client.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.clientAchievement.create).not.toHaveBeenCalled();
    });

    it('handles null metrics gracefully (new client)', async () => {
      mockPrisma.clientMetrics.findUnique.mockResolvedValue(null);
      mockPrisma.personalRecord.count.mockResolvedValue(0);
      mockPrisma.clientAchievement.findMany.mockResolvedValue([]);
      mockPrisma.workoutLog.count.mockResolvedValue(0);

      await expect(service.checkAndAward(clientId)).resolves.toBeUndefined();
      expect(mockPrisma.clientAchievement.create).not.toHaveBeenCalled();
    });

    it('awards FIRST_PR and PRS_5 when prCount >= 5', async () => {
      mockPrisma.clientMetrics.findUnique.mockResolvedValue({
        clientId,
        totalWorkouts: 0,
        workoutStreak: 0,
      });
      mockPrisma.personalRecord.count.mockResolvedValue(5);
      mockPrisma.clientAchievement.findMany.mockResolvedValue([]);
      mockPrisma.workoutLog.count.mockResolvedValue(0);
      mockPrisma.client.findUnique.mockResolvedValue({
        id: clientId,
        userId: 'user-1',
        user: { id: 'user-1' },
      });
      mockPrisma.clientAchievement.create.mockResolvedValue({});
      mockNotifications.sendToUser.mockResolvedValue(undefined);

      await service.checkAndAward(clientId);

      const createCalls = mockPrisma.clientAchievement.create.mock.calls.map(
        (c: any[]) => c[0].data.type,
      );
      expect(createCalls).toContain('FIRST_PR');
      expect(createCalls).toContain('PRS_5');
    });
  });

  describe('findForClient', () => {
    it('returns achievements enriched with metadata', async () => {
      const clientId = 'client-1';
      mockPrisma.clientAchievement.findMany.mockResolvedValue([
        { id: 'a1', clientId, type: 'FIRST_WORKOUT', earnedAt: new Date() },
      ]);

      const result = await service.findForClient(clientId);

      expect(mockPrisma.clientAchievement.findMany).toHaveBeenCalledWith({
        where: { clientId },
        orderBy: { earnedAt: 'desc' },
      });
      expect(result[0]).toMatchObject({
        type: 'FIRST_WORKOUT',
        name: 'Primeiro treino',
        icon: '🎯',
      });
    });
  });

  describe('findMy', () => {
    it('returns empty array when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      const result = await service.findMy('user-1');

      expect(result).toEqual([]);
    });

    it('delegates to findForClient when client exists', async () => {
      const clientId = 'client-1';
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      mockPrisma.clientAchievement.findMany.mockResolvedValue([]);

      const result = await service.findMy('user-1');

      expect(mockPrisma.clientAchievement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { clientId } }),
      );
      expect(result).toEqual([]);
    });
  });
});
