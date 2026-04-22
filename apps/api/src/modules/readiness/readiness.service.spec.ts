import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReadinessService, CreateReadinessDto } from './readiness.service';

describe('ReadinessService', () => {
  let service: ReadinessService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = {
    client: {
      findFirst: jest.fn(),
    },
    readinessLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadinessService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ReadinessService>(ReadinessService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── computeScore (static) ───────────────────────────────────────────────

  describe('computeScore', () => {
    it('returns 100 for best possible readiness (sleep=5, energy=5, stress=1, soreness=1)', () => {
      const score = ReadinessService.computeScore({
        sleep: 5,
        energy: 5,
        stress: 1,
        soreness: 1,
      });
      expect(score).toBe(100);
    });

    it('returns 0 for worst possible readiness (sleep=1, energy=1, stress=5, soreness=5)', () => {
      const score = ReadinessService.computeScore({
        sleep: 1,
        energy: 1,
        stress: 5,
        soreness: 5,
      });
      expect(score).toBe(0);
    });

    it('returns 50 for neutral readiness (all values equal)', () => {
      const score = ReadinessService.computeScore({
        sleep: 3,
        energy: 3,
        stress: 3,
        soreness: 3,
      });
      expect(score).toBe(50);
    });

    it('returns a value between 0 and 100 for mixed inputs', () => {
      const score = ReadinessService.computeScore({
        sleep: 4,
        energy: 3,
        stress: 2,
        soreness: 3,
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    const userId = 'user-1';
    const clientId = 'client-1';
    const dto: CreateReadinessDto = {
      sleep: 4,
      energy: 4,
      stress: 2,
      soreness: 1,
      notes: 'Feeling good',
    };

    it('creates a readiness log for the resolved client', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      const expected = { id: 'log-1', clientId, ...dto };
      mockPrisma.readinessLog.create.mockResolvedValue(expected);

      const result = await service.create(userId, dto);

      expect(mockPrisma.client.findFirst).toHaveBeenCalledWith({ where: { userId } });
      expect(mockPrisma.readinessLog.create).toHaveBeenCalledWith({
        data: { clientId, ...dto },
      });
      expect(result).toEqual(expected);
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findMy ──────────────────────────────────────────────────────────────

  describe('findMy', () => {
    const userId = 'user-1';
    const clientId = 'client-1';

    it('returns logs for the resolved client with default limit 30', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      const logs = [{ id: 'log-1', clientId }];
      mockPrisma.readinessLog.findMany.mockResolvedValue(logs);

      const result = await service.findMy(userId);

      expect(mockPrisma.readinessLog.findMany).toHaveBeenCalledWith({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: 30,
      });
      expect(result).toEqual(logs);
    });

    it('respects a custom limit', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      mockPrisma.readinessLog.findMany.mockResolvedValue([]);

      await service.findMy(userId, 7);

      expect(mockPrisma.readinessLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 7 }),
      );
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.findMy(userId)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findForClient ────────────────────────────────────────────────────────

  describe('findForClient', () => {
    it('queries readiness logs by clientId', async () => {
      const clientId = 'client-1';
      const logs = [{ id: 'log-1', clientId }];
      mockPrisma.readinessLog.findMany.mockResolvedValue(logs);

      const result = await service.findForClient(clientId);

      expect(mockPrisma.readinessLog.findMany).toHaveBeenCalledWith({
        where: { clientId },
        orderBy: { date: 'desc' },
        take: 30,
      });
      expect(result).toEqual(logs);
    });
  });

  // ─── todayScore ───────────────────────────────────────────────────────────

  describe('todayScore', () => {
    const userId = 'user-1';
    const clientId = 'client-1';

    it('returns today\'s readiness log when found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      const log = { id: 'log-1', clientId, sleep: 4, energy: 4, stress: 2, soreness: 1 };
      mockPrisma.readinessLog.findFirst.mockResolvedValue(log);

      const result = await service.todayScore(userId);

      expect(mockPrisma.readinessLog.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId }),
          orderBy: { date: 'desc' },
        }),
      );
      expect(result).toEqual(log);
    });

    it('returns null when no log found for today', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: clientId });
      mockPrisma.readinessLog.findFirst.mockResolvedValue(null);

      const result = await service.todayScore(userId);

      expect(result).toBeNull();
    });

    it('throws NotFoundException when client not found', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null);

      await expect(service.todayScore(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
