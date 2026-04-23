import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NutritionService, MealItem } from './nutrition.service';
import { PrismaService } from '../prisma/prisma.service';

const mockItems: MealItem[] = [
  { foodName: 'Frango grelhado', grams: 150, kcal: 250, protein: 45, carbs: 0, fat: 6 },
  { foodName: 'Arroz branco', grams: 100, kcal: 130, protein: 3, carbs: 28, fat: 0 },
];

describe('NutritionService', () => {
  let service: NutritionService;

  const mockPrisma = {
    food: { findMany: jest.fn(), create: jest.fn() },
    mealPlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    mealPlanDay: { upsert: jest.fn() },
    mealPlanMeal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    mealPlanSnapshot: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    client: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NutritionService>(NutritionService);
  });

  // ─── searchFoods ──────────────────────────────────────────────────────────

  describe('searchFoods', () => {
    it('searches foods case-insensitively and limits to 20', () => {
      mockPrisma.food.findMany.mockResolvedValue([{ id: 'f-1', name: 'Frango' }]);

      service.searchFoods('frango');

      expect(mockPrisma.food.findMany).toHaveBeenCalledWith({
        where: { name: { contains: 'frango', mode: 'insensitive' } },
        take: 20,
        orderBy: { name: 'asc' },
      });
    });
  });

  // ─── createFood ───────────────────────────────────────────────────────────

  describe('createFood', () => {
    it('creates custom food with isCustom flag', () => {
      mockPrisma.food.create.mockResolvedValue({ id: 'f-1' });
      const data = { name: 'Batata-doce', kcal: 86, protein: 2, carbs: 20, fat: 0 };

      service.createFood(data);

      expect(mockPrisma.food.create).toHaveBeenCalledWith({
        data: { ...data, isCustom: true },
      });
    });
  });

  // ─── findPlansByClient ────────────────────────────────────────────────────

  describe('findPlansByClient', () => {
    it('returns plans ordered by startDate desc with days and meals', () => {
      mockPrisma.mealPlan.findMany.mockResolvedValue([{ id: 'mp-1' }]);

      service.findPlansByClient('c-1');

      expect(mockPrisma.mealPlan.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { clientId: 'c-1' },
        orderBy: { startDate: 'desc' },
      }));
    });
  });

  // ─── findPlanById ─────────────────────────────────────────────────────────

  describe('findPlanById', () => {
    it('returns plan when found', async () => {
      mockPrisma.mealPlan.findUnique.mockResolvedValue({ id: 'mp-1' });

      const result = await service.findPlanById('mp-1');

      expect(result).toMatchObject({ id: 'mp-1' });
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.mealPlan.findUnique.mockResolvedValue(null);

      await expect(service.findPlanById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── createPlan ───────────────────────────────────────────────────────────

  describe('createPlan', () => {
    it('creates plan converting date strings to Dates', () => {
      mockPrisma.mealPlan.create.mockResolvedValue({ id: 'mp-1' });

      service.createPlan({ clientId: 'c-1', name: 'Plano Maio', startDate: '2026-05-01', endDate: '2026-05-31' });

      expect(mockPrisma.mealPlan.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          startDate: new Date('2026-05-01'),
          endDate: new Date('2026-05-31'),
        }),
      }));
    });

    it('sets endDate to null when not provided', () => {
      mockPrisma.mealPlan.create.mockResolvedValue({ id: 'mp-1' });

      service.createPlan({ clientId: 'c-1', name: 'Plano Aberto', startDate: '2026-05-01' });

      const call = mockPrisma.mealPlan.create.mock.calls[0][0];
      expect(call.data.endDate).toBeNull();
    });
  });

  // ─── deletePlan ───────────────────────────────────────────────────────────

  describe('deletePlan', () => {
    it('deletes plan when it exists', async () => {
      mockPrisma.mealPlan.findUnique.mockResolvedValue({ id: 'mp-1' });
      mockPrisma.mealPlan.delete.mockResolvedValue({ id: 'mp-1' });

      await service.deletePlan('mp-1');

      expect(mockPrisma.mealPlan.delete).toHaveBeenCalledWith({ where: { id: 'mp-1' } });
    });

    it('throws NotFoundException when plan not found', async () => {
      mockPrisma.mealPlan.findUnique.mockResolvedValue(null);

      await expect(service.deletePlan('missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── upsertDay ────────────────────────────────────────────────────────────

  describe('upsertDay', () => {
    it('upserts a day by planId + dayOfWeek', () => {
      mockPrisma.mealPlanDay.upsert.mockResolvedValue({ id: 'd-1' });

      service.upsertDay('mp-1', 1, 'Segunda-feira');

      expect(mockPrisma.mealPlanDay.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: { planId_dayOfWeek: { planId: 'mp-1', dayOfWeek: 1 } },
      }));
    });
  });

  // ─── addMeal ──────────────────────────────────────────────────────────────

  describe('addMeal', () => {
    it('sums kcal from items and creates meal', async () => {
      mockPrisma.mealPlanMeal.create.mockResolvedValue({ id: 'meal-1' });

      await service.addMeal('d-1', 'Almoço', mockItems);

      expect(mockPrisma.mealPlanMeal.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          dayId: 'd-1',
          name: 'Almoço',
          kcal: 380, // 250 + 130
        }),
      }));
    });
  });

  // ─── deleteMeal ───────────────────────────────────────────────────────────

  describe('deleteMeal', () => {
    it('delegates to prisma', () => {
      mockPrisma.mealPlanMeal.delete.mockResolvedValue({ id: 'meal-1' });

      service.deleteMeal('meal-1');

      expect(mockPrisma.mealPlanMeal.delete).toHaveBeenCalledWith({ where: { id: 'meal-1' } });
    });
  });

  // ─── getSnapshots / getSnapshot ───────────────────────────────────────────

  describe('getSnapshots', () => {
    it('returns snapshots ordered by createdAt desc', () => {
      mockPrisma.mealPlanSnapshot.findMany.mockResolvedValue([{ id: 'snap-1', createdAt: new Date() }]);

      service.getSnapshots('mp-1');

      expect(mockPrisma.mealPlanSnapshot.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { planId: 'mp-1' },
        orderBy: { createdAt: 'desc' },
      }));
    });
  });

  describe('getSnapshot', () => {
    it('returns snapshot by id', () => {
      mockPrisma.mealPlanSnapshot.findUnique.mockResolvedValue({ id: 'snap-1' });

      service.getSnapshot('snap-1');

      expect(mockPrisma.mealPlanSnapshot.findUnique).toHaveBeenCalledWith({ where: { id: 'snap-1' } });
    });
  });

  // ─── getMyPlan ────────────────────────────────────────────────────────────

  describe('getMyPlan', () => {
    it('returns active plan for user', async () => {
      mockPrisma.client.findUnique.mockResolvedValue({ id: 'c-1' });
      mockPrisma.mealPlan.findFirst.mockResolvedValue({ id: 'mp-1', clientId: 'c-1' });

      const result = await service.getMyPlan('u-1');

      expect(mockPrisma.mealPlan.findFirst).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ clientId: 'c-1' }),
      }));
      expect(result).toMatchObject({ id: 'mp-1' });
    });

    it('returns null when user has no client profile', async () => {
      mockPrisma.client.findUnique.mockResolvedValue(null);

      const result = await service.getMyPlan('u-orphan');

      expect(mockPrisma.mealPlan.findFirst).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
