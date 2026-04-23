import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecordType } from '@prisma/client';
import { PersonalRecordsService } from './personal-records.service';
import { PersonalRecordsRepository } from './personal-records.repository';

describe('PersonalRecordsService', () => {
  let service: PersonalRecordsService;

  // The delete method accesses repo['prisma'] directly — we expose it on the mock.
  const mockPrismaOnRepo = {
    personalRecord: { findUnique: jest.fn() },
  };

  const mockRepo = {
    create: jest.fn(),
    findByClient: jest.fn(),
    findBestByClient: jest.fn(),
    findHistoryForExercise: jest.fn(),
    delete: jest.fn(),
    prisma: mockPrismaOnRepo,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonalRecordsService,
        { provide: PersonalRecordsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PersonalRecordsService>(PersonalRecordsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a record with provided recordedAt converted to Date', () => {
      const dto = {
        clientId: 'c-1',
        exerciseName: 'Squat',
        type: RecordType.WEIGHT_KG,
        value: 120,
        recordedAt: '2026-04-10',
      };
      mockRepo.create.mockResolvedValue({ id: 'pr-1', ...dto });

      service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        recordedAt: new Date('2026-04-10'),
      }));
    });

    it('passes undefined for recordedAt when not provided (repo sets default)', () => {
      const dto = { clientId: 'c-1', exerciseName: 'Deadlift', type: RecordType.WEIGHT_KG, value: 150 };
      mockRepo.create.mockResolvedValue({ id: 'pr-2', ...dto });

      service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        recordedAt: undefined,
      }));
    });
  });

  // ─── getByClient ──────────────────────────────────────────────────────────

  describe('getByClient', () => {
    it('delegates to repository', () => {
      mockRepo.findByClient.mockResolvedValue([{ id: 'pr-1' }]);

      service.getByClient('c-1');

      expect(mockRepo.findByClient).toHaveBeenCalledWith('c-1');
    });
  });

  // ─── getBestByClient ──────────────────────────────────────────────────────

  describe('getBestByClient', () => {
    it('delegates to repository', () => {
      mockRepo.findBestByClient.mockResolvedValue([]);

      service.getBestByClient('c-1');

      expect(mockRepo.findBestByClient).toHaveBeenCalledWith('c-1');
    });
  });

  // ─── getHistory ───────────────────────────────────────────────────────────

  describe('getHistory', () => {
    it('delegates to repository with clientId and exerciseName', () => {
      mockRepo.findHistoryForExercise.mockResolvedValue([]);

      service.getHistory('c-1', 'Bench Press');

      expect(mockRepo.findHistoryForExercise).toHaveBeenCalledWith('c-1', 'Bench Press');
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes record when it exists', async () => {
      mockPrismaOnRepo.personalRecord.findUnique.mockResolvedValue({ id: 'pr-1' });
      mockRepo.delete.mockResolvedValue({ id: 'pr-1' });

      await service.delete('pr-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('pr-1');
    });

    it('throws NotFoundException when record does not exist', async () => {
      mockPrismaOnRepo.personalRecord.findUnique.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
