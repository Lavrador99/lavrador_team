import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { AssessmentsRepository } from '../repositories/assessments.repository';

jest.mock('./assessment-classifier', () => ({
  classifyAssessment: jest.fn().mockReturnValue({
    level: 'INTERMEDIATE',
    flags: ['hipertensao'],
    fcmax: 185,
    karvonenZones: { z1: [111, 148], z2: [148, 166] },
  }),
}));

describe('AssessmentsService', () => {
  let service: AssessmentsService;

  const mockRepo = {
    create: jest.fn(),
    findByClient: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        { provide: AssessmentsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto = {
      clientId: 'c-1',
      data: { pessoal: { idade: 35, PAS: 140, PAD: 90 } },
    };

    it('classifies assessment and persists with computed fields', async () => {
      mockRepo.create.mockResolvedValue({ id: 'a-1', clientId: 'c-1', level: 'INTERMEDIATE' });

      const result = await service.create(dto as any);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 'c-1',
        level: 'INTERMEDIATE',
        flags: ['hipertensao'],
        data: expect.objectContaining({
          _computed: expect.objectContaining({ fcmax: 185 }),
        }),
      }));
      expect(result).toMatchObject({ id: 'a-1' });
    });

    it('merges original data with _computed block', async () => {
      mockRepo.create.mockResolvedValue({ id: 'a-1' });

      await service.create(dto as any);

      const savedData = mockRepo.create.mock.calls[0][0].data;
      expect(savedData).toMatchObject(dto.data);
      expect(savedData._computed).toBeDefined();
    });
  });

  // ─── findByClient ─────────────────────────────────────────────────────────

  describe('findByClient', () => {
    it('delegates to repository', async () => {
      mockRepo.findByClient.mockResolvedValue([{ id: 'a-1' }]);

      const result = await service.findByClient('c-1');

      expect(mockRepo.findByClient).toHaveBeenCalledWith('c-1');
      expect(result).toHaveLength(1);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns assessment when found', async () => {
      mockRepo.findById.mockResolvedValue({ id: 'a-1', level: 'BEGINNER' });

      const result = await service.findById('a-1');

      expect(result).toMatchObject({ id: 'a-1' });
    });

    it('throws NotFoundException when assessment does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
