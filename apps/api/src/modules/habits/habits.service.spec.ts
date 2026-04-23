import { Test, TestingModule } from '@nestjs/testing';
import { HabitsService } from './habits.service';
import { HabitsRepository } from './habits.repository';

describe('HabitsService', () => {
  let service: HabitsService;

  const mockRepo = {
    createHabit: jest.fn(),
    findByClient: jest.fn(),
    updateHabit: jest.fn(),
    deleteHabit: jest.fn(),
    logHabit: jest.fn(),
    getWeeklyAdherence: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitsService,
        { provide: HabitsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<HabitsService>(HabitsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a habit with required fields', () => {
      const data = { clientId: 'c-1', name: 'Beber 2L de água', icon: '💧', frequency: 'DAILY' };
      mockRepo.createHabit.mockResolvedValue({ id: 'h-1', ...data });

      service.create(data);

      expect(mockRepo.createHabit).toHaveBeenCalledWith(data);
    });
  });

  // ─── findByClient ─────────────────────────────────────────────────────────

  describe('findByClient', () => {
    it('delegates to repository with clientId', () => {
      mockRepo.findByClient.mockResolvedValue([{ id: 'h-1' }]);

      service.findByClient('c-1');

      expect(mockRepo.findByClient).toHaveBeenCalledWith('c-1');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates habit fields', () => {
      const update = { name: 'Novo nome', isActive: false };
      mockRepo.updateHabit.mockResolvedValue({ id: 'h-1', ...update });

      service.update('h-1', update);

      expect(mockRepo.updateHabit).toHaveBeenCalledWith('h-1', update);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('delegates to repository with habit id', () => {
      mockRepo.deleteHabit.mockResolvedValue({ id: 'h-1' });

      service.delete('h-1');

      expect(mockRepo.deleteHabit).toHaveBeenCalledWith('h-1');
    });
  });

  // ─── log ──────────────────────────────────────────────────────────────────

  describe('log', () => {
    it('converts date string to Date object before logging', () => {
      mockRepo.logHabit.mockResolvedValue({ id: 'log-1' });

      service.log('h-1', '2026-04-23', true);

      expect(mockRepo.logHabit).toHaveBeenCalledWith('h-1', new Date('2026-04-23'), true);
    });

    it('defaults completed to true when not provided', () => {
      mockRepo.logHabit.mockResolvedValue({ id: 'log-1' });

      service.log('h-1', '2026-04-23');

      expect(mockRepo.logHabit).toHaveBeenCalledWith('h-1', expect.any(Date), true);
    });

    it('passes false when completed is explicitly false', () => {
      mockRepo.logHabit.mockResolvedValue({ id: 'log-1' });

      service.log('h-1', '2026-04-23', false);

      expect(mockRepo.logHabit).toHaveBeenCalledWith('h-1', expect.any(Date), false);
    });
  });

  // ─── getWeeklyAdherence ───────────────────────────────────────────────────

  describe('getWeeklyAdherence', () => {
    it('returns adherence data for client', () => {
      mockRepo.getWeeklyAdherence.mockResolvedValue([{ habitId: 'h-1', rate: 0.85 }]);

      service.getWeeklyAdherence('c-1');

      expect(mockRepo.getWeeklyAdherence).toHaveBeenCalledWith('c-1');
    });
  });
});
