import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { WorkoutsRepository } from '../repositories/workouts.repository';
import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AchievementsService } from '../../achievements/achievements.service';

// Zod schemas validate blocks/entries — use minimal valid payloads in tests.
const validBlock = {
  type: 'SEQUENTIAL',
  restBetweenSets: 60,
  restAfterBlock: 120,
  exercises: [
    {
      exerciseId: 'ex-1',
      exerciseName: 'Squat',
      sets: 3,
      reps: 10,
      load: 80,
      tempo: '2010',
      restBetweenSets: 60,
    },
  ],
};

const validLogEntry = {
  exerciseId: 'ex-1',
  exerciseName: 'Squat',
  sets: [{ reps: 10, load: 80, completed: true }],
};

describe('WorkoutsService', () => {
  let service: WorkoutsService;

  const mockRepo = {
    create: jest.fn(),
    findByProgram: jest.fn(),
    findByClient: jest.fn(),
    findActiveByUser: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createLog: jest.fn(),
    findLogsByWorkout: jest.fn(),
    findLogsByClient: jest.fn(),
    findExerciseHistory: jest.fn(),
    findCalendar: jest.fn(),
    findMuscleVolume: jest.fn(),
    findLastLogByWorkout: jest.fn(),
  };

  const mockPrisma = {
    program: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
    personalRecord: { findFirst: jest.fn(), create: jest.fn() },
    workoutLog: { findMany: jest.fn() },
    clientMetrics: { upsert: jest.fn() },
  };

  const mockEmail = {
    sendPlanUpdated: jest.fn().mockResolvedValue(undefined),
  };

  const mockAchievements = {
    checkAndAward: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: WorkoutsRepository, useValue: mockRepo },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmail },
        { provide: AchievementsService, useValue: mockAchievements },
      ],
    }).compile();

    service = module.get<WorkoutsService>(WorkoutsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a workout with valid blocks and calculates duration', async () => {
      mockRepo.create.mockResolvedValue({ id: 'w-1', name: 'Treino A' });

      const result = await service.create({
        name: 'Treino A',
        clientId: 'c-1',
        blocks: [validBlock],
      } as any);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Treino A',
        clientId: 'c-1',
        durationEstimatedMin: expect.any(Number),
      }));
      expect(result).toMatchObject({ id: 'w-1' });
    });

    it('throws BadRequestException for invalid blocks', async () => {
      const invalidBlock = { type: 'INVALID_TYPE', exercises: [] };

      await expect(service.create({ name: 'Bad', blocks: [invalidBlock] } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('creates workout with empty blocks array', async () => {
      mockRepo.create.mockResolvedValue({ id: 'w-2' });

      await service.create({ name: 'Treino Vazio', blocks: [] } as any);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        durationEstimatedMin: 0,
      }));
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns workout for PT/ADMIN without role check', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'w-1', program: null, clientId: 'c-1' });

      const result = await service.findById('w-1');

      expect(result).toMatchObject({ id: 'w-1' });
    });

    it('throws NotFoundException when workout not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when CLIENT accesses another client workout', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'w-1',
        program: { clientId: 'c-other' },
        clientId: 'c-other',
      });
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c-mine' });

      await expect(service.findById('w-1', 'u-1', 'CLIENT')).rejects.toThrow(ForbiddenException);
    });

    it('allows CLIENT to access their own workout', async () => {
      mockRepo.findById.mockResolvedValue({
        id: 'w-1',
        program: { clientId: 'c-1' },
        clientId: 'c-1',
      });
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c-1' });

      const result = await service.findById('w-1', 'u-1', 'CLIENT');

      expect(result).toMatchObject({ id: 'w-1' });
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates workout fields', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'w-1', status: 'DRAFT', clientId: 'c-1' });
      mockRepo.update.mockResolvedValue({ id: 'w-1', name: 'Updated' });

      const result = await service.update('w-1', { name: 'Updated' } as any);

      expect(result).toMatchObject({ name: 'Updated' });
    });

    it('throws BadRequestException for invalid blocks in update', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'w-1', status: 'DRAFT' });

      await expect(service.update('w-1', { blocks: [{ type: 'INVALID' }] } as any))
        .rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when workout not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes workout when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'w-1' });
      mockRepo.delete.mockResolvedValue({ id: 'w-1' });

      await service.remove('w-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('w-1');
    });

    it('throws NotFoundException when workout not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── resolveClientId ──────────────────────────────────────────────────────

  describe('resolveClientId', () => {
    it('returns clientId for user with client profile', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c-1' });

      const result = await service.resolveClientId('u-1');

      expect(result).toBe('c-1');
    });

    it('throws UnprocessableEntityException when no client profile found', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      await expect(service.resolveClientId('u-orphan')).rejects.toThrow(UnprocessableEntityException);
    });
  });

  // ─── calcDurationPreview ──────────────────────────────────────────────────

  describe('calcDurationPreview', () => {
    it('returns duration for valid blocks without persisting', () => {
      const result = service.calcDurationPreview([validBlock]);

      expect(result).toHaveProperty('totalMin');
      expect(typeof result.totalMin).toBe('number');
    });

    it('returns 0 min for empty blocks', () => {
      const result = service.calcDurationPreview([]);

      expect(result.totalMin).toBe(0);
    });
  });

  // ─── createLog ────────────────────────────────────────────────────────────

  describe('createLog', () => {
    beforeEach(() => {
      mockRepo.findById.mockResolvedValue({ id: 'w-1' });
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockRepo.createLog.mockResolvedValue({ id: 'log-1' });
      mockPrisma.personalRecord.findFirst.mockResolvedValue(null);
      mockPrisma.personalRecord.create.mockResolvedValue({});
      mockPrisma.workoutLog.findMany.mockResolvedValue([]);
      mockPrisma.clientMetrics.upsert.mockResolvedValue({});
    });

    it('creates a workout log and triggers background tasks', async () => {
      const dto = {
        workoutId: 'w-1',
        entries: [validLogEntry],
        date: '2026-04-23',
      };

      const result = await service.createLog(dto as any, 'u-1');

      expect(mockRepo.createLog).toHaveBeenCalledWith(expect.objectContaining({
        workoutId: 'w-1',
        clientId: 'c-1',
        date: new Date('2026-04-23'),
      }));
      expect(result).toMatchObject({ id: 'log-1' });
    });

    it('throws BadRequestException for invalid log entries', async () => {
      await expect(
        service.createLog({ workoutId: 'w-1', entries: ['invalid'] } as any, 'u-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('uses today as date when dto.date is not provided', async () => {
      await service.createLog({ workoutId: 'w-1', entries: [validLogEntry] } as any, 'u-1');

      expect(mockRepo.createLog).toHaveBeenCalledWith(expect.objectContaining({
        date: expect.any(Date),
      }));
    });
  });

  // ─── Delegation tests ─────────────────────────────────────────────────────

  describe('findByProgram', () => {
    it('delegates to repository', async () => {
      mockRepo.findByProgram.mockResolvedValue([]);
      await service.findByProgram('p-1');
      expect(mockRepo.findByProgram).toHaveBeenCalledWith('p-1');
    });
  });

  describe('findByClient', () => {
    it('delegates to repository', async () => {
      mockRepo.findByClient.mockResolvedValue([]);
      await service.findByClient('c-1');
      expect(mockRepo.findByClient).toHaveBeenCalledWith('c-1');
    });
  });

  describe('getLogsByWorkout', () => {
    it('delegates to repository', async () => {
      mockRepo.findLogsByWorkout.mockResolvedValue([]);
      await service.getLogsByWorkout('w-1');
      expect(mockRepo.findLogsByWorkout).toHaveBeenCalledWith('w-1');
    });
  });

  describe('getLogsByClient', () => {
    it('delegates to repository', async () => {
      mockRepo.findLogsByClient.mockResolvedValue([]);
      await service.getLogsByClient('c-1');
      expect(mockRepo.findLogsByClient).toHaveBeenCalledWith('c-1');
    });
  });

  describe('getExerciseHistory', () => {
    it('delegates to repository', async () => {
      mockRepo.findExerciseHistory.mockResolvedValue([]);
      await service.getExerciseHistory('c-1', 'ex-1');
      expect(mockRepo.findExerciseHistory).toHaveBeenCalledWith('c-1', 'ex-1');
    });
  });

  describe('getLastLog', () => {
    it('resolves clientId then delegates to repository', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockRepo.findLastLogByWorkout.mockResolvedValue({ id: 'log-1' });

      const result = await service.getLastLog('w-1', 'u-1');

      expect(mockRepo.findLastLogByWorkout).toHaveBeenCalledWith('w-1', 'c-1');
      expect(result).toMatchObject({ id: 'log-1' });
    });
  });
});
