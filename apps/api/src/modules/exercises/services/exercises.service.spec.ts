import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Equipment, MovementPattern } from '@prisma/client';
import { ExercisesService } from './exercises.service';
import { ExercisesRepository } from '../repositories/exercises.repository';

describe('ExercisesService', () => {
  let service: ExercisesService;

  const mockRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findByPattern: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        { provide: ExercisesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('passes filters to repository', async () => {
      mockRepo.findAll.mockResolvedValue([]);
      const dto = { pattern: MovementPattern.PUSH, level: 'BEGINNER', search: 'squat' } as any;

      await service.findAll(dto);

      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
        pattern: MovementPattern.PUSH,
        search: 'squat',
      }));
    });

    it('parses comma-separated equipment string into array', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      await service.findAll({ equipment: 'BARBELL,DUMBBELL' } as any);

      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
        equipment: ['BARBELL', 'DUMBBELL'],
      }));
    });

    it('passes undefined equipment when not provided', async () => {
      mockRepo.findAll.mockResolvedValue([]);

      await service.findAll({} as any);

      expect(mockRepo.findAll).toHaveBeenCalledWith(expect.objectContaining({
        equipment: undefined,
      }));
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns exercise when found', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'ex-1', name: 'Squat' });

      const result = await service.findById('ex-1');

      expect(result).toEqual({ id: 'ex-1', name: 'Squat' });
    });

    it('throws NotFoundException when exercise does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to repository', async () => {
      const dto = { name: 'Deadlift', pattern: MovementPattern.HINGE } as any;
      mockRepo.create.mockResolvedValue({ id: 'ex-2', ...dto });

      const result = await service.create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toMatchObject({ name: 'Deadlift' });
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates exercise after validating it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'ex-1' });
      mockRepo.update.mockResolvedValue({ id: 'ex-1', name: 'Bench Press Updated' });

      const result = await service.update('ex-1', { name: 'Bench Press Updated' } as any);

      expect(mockRepo.update).toHaveBeenCalledWith('ex-1', expect.objectContaining({ name: 'Bench Press Updated' }));
      expect(result).toMatchObject({ name: 'Bench Press Updated' });
    });

    it('throws NotFoundException when exercise not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.update('missing', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes exercise after validating it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'ex-1' });
      mockRepo.softDelete.mockResolvedValue({ id: 'ex-1' });

      await service.remove('ex-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('ex-1');
    });

    it('throws NotFoundException when exercise not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getSuggestionsForPattern ─────────────────────────────────────────────

  describe('getSuggestionsForPattern', () => {
    it('returns up to limit exercises for pattern and equipment', async () => {
      const exercises = [
        { id: 'ex-1', name: 'Push-up' },
        { id: 'ex-2', name: 'Bench Press' },
        { id: 'ex-3', name: 'Overhead Press' },
        { id: 'ex-4', name: 'Cable Fly' },
      ];
      mockRepo.findByPattern.mockResolvedValue(exercises);

      const result = await service.getSuggestionsForPattern(
        MovementPattern.PUSH,
        [Equipment.BARBELL],
        3,
      );

      expect(mockRepo.findByPattern).toHaveBeenCalledWith(MovementPattern.PUSH, [Equipment.BARBELL]);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(exercises[0]);
    });

    it('returns all exercises when fewer than limit', async () => {
      mockRepo.findByPattern.mockResolvedValue([{ id: 'ex-1' }]);

      const result = await service.getSuggestionsForPattern(MovementPattern.PULL, [], 3);

      expect(result).toHaveLength(1);
    });

    it('uses default limit of 3', async () => {
      mockRepo.findByPattern.mockResolvedValue([
        { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' },
      ]);

      const result = await service.getSuggestionsForPattern(MovementPattern.PUSH, []);

      expect(result).toHaveLength(3);
    });
  });
});
