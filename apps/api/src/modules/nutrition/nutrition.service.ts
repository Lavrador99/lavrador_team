import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MealItem {
  foodId?: string;
  foodName: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Injectable()
export class NutritionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Foods ─────────────────────────────────────────────────────────────────

  searchFoods(query: string) {
    return this.prisma.food.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  createFood(data: { name: string; kcal: number; protein: number; carbs: number; fat: number; fiber?: number }) {
    return this.prisma.food.create({ data: { ...data, isCustom: true } });
  }

  // ─── Meal Plans ────────────────────────────────────────────────────────────

  findPlansByClient(clientId: string) {
    return this.prisma.mealPlan.findMany({
      where: { clientId },
      include: { days: { include: { meals: true }, orderBy: { dayOfWeek: 'asc' } } },
      orderBy: { startDate: 'desc' },
    });
  }

  async findPlanById(id: string) {
    const plan = await this.prisma.mealPlan.findUnique({
      where: { id },
      include: { days: { include: { meals: true }, orderBy: { dayOfWeek: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  createPlan(data: { clientId: string; name: string; startDate: string; endDate?: string; notes?: string }) {
    return this.prisma.mealPlan.create({
      data: {
        clientId: data.clientId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes,
      },
      include: { days: true },
    });
  }

  async deletePlan(id: string) {
    await this.findPlanById(id);
    return this.prisma.mealPlan.delete({ where: { id } });
  }

  // ─── Days + Meals ──────────────────────────────────────────────────────────

  upsertDay(planId: string, dayOfWeek: number, label?: string) {
    return this.prisma.mealPlanDay.upsert({
      where: { planId_dayOfWeek: { planId, dayOfWeek } },
      create: { planId, dayOfWeek, label },
      update: { label },
      include: { meals: true },
    });
  }

  async addMeal(dayId: string, name: string, items: MealItem[]) {
    const kcal = items.reduce((s, i) => s + i.kcal, 0);
    return this.prisma.mealPlanMeal.create({ data: { dayId, name, items: items as any, kcal } });
  }

  async updateMeal(mealId: string, name: string, items: MealItem[]) {
    const kcal = items.reduce((s, i) => s + i.kcal, 0);
    return this.prisma.mealPlanMeal.update({ where: { id: mealId }, data: { name, items: items as any, kcal } });
  }

  deleteMeal(mealId: string) {
    return this.prisma.mealPlanMeal.delete({ where: { id: mealId } });
  }

  // ─── Client's active plan ──────────────────────────────────────────────────

  async getMyPlan(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } });
    if (!client) return null;
    const plan = await this.prisma.mealPlan.findFirst({
      where: {
        clientId: client.id,
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      include: { days: { include: { meals: true }, orderBy: { dayOfWeek: 'asc' } } },
      orderBy: { startDate: 'desc' },
    });
    return plan;
  }
}
