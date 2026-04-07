import { api } from './axios';

export interface FoodDto {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  isCustom: boolean;
}

export interface MealItem {
  foodId?: string;
  foodName: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealDto {
  id: string;
  dayId: string;
  name: string;
  kcal: number;
  items: MealItem[];
}

export interface MealPlanDayDto {
  id: string;
  planId: string;
  dayOfWeek: number;
  label?: string | null;
  meals: MealDto[];
}

export interface MealPlanDto {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  createdAt: string;
  days: MealPlanDayDto[];
}

export const nutritionApi = {
  searchFoods: async (q: string): Promise<FoodDto[]> => {
    const { data } = await api.get(`/nutrition/foods?q=${encodeURIComponent(q)}`);
    return data;
  },

  createFood: async (body: Omit<FoodDto, 'id' | 'isCustom'>): Promise<FoodDto> => {
    const { data } = await api.post('/nutrition/foods', body);
    return data;
  },

  getMyPlan: async (): Promise<MealPlanDto | null> => {
    const { data } = await api.get('/nutrition/my-plan');
    return data;
  },

  getPlansByClient: async (clientId: string): Promise<MealPlanDto[]> => {
    const { data } = await api.get(`/nutrition/plans/client/${clientId}`);
    return data;
  },

  createPlan: async (body: { clientId: string; name: string; startDate: string; endDate?: string; notes?: string }): Promise<MealPlanDto> => {
    const { data } = await api.post('/nutrition/plans', body);
    return data;
  },

  deletePlan: async (id: string): Promise<void> => {
    await api.delete(`/nutrition/plans/${id}`);
  },
};
