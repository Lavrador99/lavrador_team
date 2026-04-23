import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { ProgramsRepository } from '../repositories/programs.repository';
import { AssessmentsService } from '../../assessments/services/assessments.service';
import { ExercisesService } from '../../exercises/services/exercises.service';
import { PrismaService } from '../../prisma/prisma.service';

// The prescription engine is a pure function — we trust it returns phases.
// We only verify that ProgramsService wires inputs/outputs correctly.
jest.mock('./prescription-engine', () => ({
  generatePrescriptionPlan: jest.fn().mockReturnValue({
    phases: [{ week: 1, sets: { min: 3, max: 4 } }],
    validationWarnings: [],
  }),
}));

describe('ProgramsService', () => {
  let service: ProgramsService;

  const mockRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByClient: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    updateSelections: jest.fn(),
  };

  const mockAssessments = {
    findById: jest.fn(),
  };

  // ExercisesService exposes its private exercisesRepository; we mock the class
  // so we can also reach the private field through bracket notation.
  const mockExercisesRepo = {
    findByIds: jest.fn(),
  };
  const mockExercises = {
    exercisesRepository: mockExercisesRepo,
  };

  const mockPrisma = {
    program: { create: jest.fn() },
  };

  const baseAssessment = {
    id: 'a-1',
    level: 'INTERMEDIATE',
    data: { nome: 'João', objetivo: 'Hipertrofia' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: ProgramsRepository, useValue: mockRepo },
        { provide: AssessmentsService, useValue: mockAssessments },
        { provide: ExercisesService, useValue: mockExercises },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
  });

  // ─── generate ─────────────────────────────────────────────────────────────

  describe('generate', () => {
    const dto = {
      clientId: 'c-1',
      assessmentId: 'a-1',
      selectedExercises: [
        { exerciseId: 'ex-1', pattern: 'PUSH', type: 'PRIMARY' },
      ],
    };

    beforeEach(() => {
      mockAssessments.findById.mockResolvedValue(baseAssessment);
      mockExercisesRepo.findByIds.mockResolvedValue([{ id: 'ex-1', name: 'Bench Press' }]);
      mockRepo.create.mockResolvedValue({ id: 'prog-1', name: 'João · Hipertrofia · 23/04/2026' });
    });

    it('generates a program from assessment and selected exercises', async () => {
      const result = await service.generate(dto as any);

      expect(mockAssessments.findById).toHaveBeenCalledWith('a-1');
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 'c-1',
        assessmentId: 'a-1',
      }));
      expect(result).toMatchObject({ id: 'prog-1' });
    });

    it('includes validationWarnings in result', async () => {
      const result = await service.generate(dto as any);

      expect(result).toHaveProperty('validationWarnings');
    });

    it('enriches exercise names from repository for prescription engine', async () => {
      await service.generate(dto as any);

      expect(mockExercisesRepo.findByIds).toHaveBeenCalledWith(['ex-1']);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns program when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'prog-1' });

      const result = await service.findById('prog-1');

      expect(result).toEqual({ id: 'prog-1' });
    });

    it('throws NotFoundException when program not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByClient ─────────────────────────────────────────────────────────

  describe('findByClient', () => {
    it('delegates to repository', async () => {
      mockRepo.findByClient.mockResolvedValue([{ id: 'prog-1' }]);

      const result = await service.findByClient('c-1');

      expect(mockRepo.findByClient).toHaveBeenCalledWith('c-1');
      expect(result).toHaveLength(1);
    });
  });

  // ─── archive ──────────────────────────────────────────────────────────────

  describe('archive', () => {
    it('sets status to ARCHIVED', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'prog-1' });
      mockRepo.updateStatus.mockResolvedValue({ id: 'prog-1', status: 'ARCHIVED' });

      await service.archive('prog-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('prog-1', 'ARCHIVED');
    });

    it('throws NotFoundException when program not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.archive('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes program when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'prog-1' });
      mockRepo.delete.mockResolvedValue({ id: 'prog-1' });

      await service.delete('prog-1');

      expect(mockRepo.delete).toHaveBeenCalledWith('prog-1');
    });

    it('throws NotFoundException when program not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── clone ────────────────────────────────────────────────────────────────

  describe('clone', () => {
    const source = {
      id: 'prog-1',
      name: 'Plano Original',
      assessmentId: 'a-1',
      phases: [],
      exerciseSelections: [{ exerciseId: 'ex-1', pattern: 'PUSH', type: 'PRIMARY' }],
    };

    it('clones program with auto-generated name', async () => {
      mockRepo.findById.mockResolvedValue(source);
      mockPrisma.program.create.mockResolvedValue({ id: 'prog-2', name: 'Plano Original (cópia)' });

      const result = await service.clone('prog-1', 'c-2');

      expect(mockPrisma.program.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          clientId: 'c-2',
          name: 'Plano Original (cópia)',
        }),
      }));
      expect(result).toMatchObject({ id: 'prog-2' });
    });

    it('uses provided name when given', async () => {
      mockRepo.findById.mockResolvedValue(source);
      mockPrisma.program.create.mockResolvedValue({ id: 'prog-2', name: 'Nome Personalizado' });

      await service.clone('prog-1', 'c-2', 'Nome Personalizado');

      expect(mockPrisma.program.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ name: 'Nome Personalizado' }),
      }));
    });
  });

  // ─── exportJson ───────────────────────────────────────────────────────────

  describe('exportJson', () => {
    it('returns export envelope with program data', async () => {
      const program = { id: 'prog-1', name: 'Plano', status: 'ACTIVE', createdAt: new Date(), assessment: {}, phases: [], exerciseSelections: [] };
      mockRepo.findById.mockResolvedValue(program);

      const result = await service.exportJson('prog-1');

      expect(result).toHaveProperty('exportedAt');
      expect(result.program).toMatchObject({ id: 'prog-1', name: 'Plano' });
    });

    it('throws NotFoundException when program not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.exportJson('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
