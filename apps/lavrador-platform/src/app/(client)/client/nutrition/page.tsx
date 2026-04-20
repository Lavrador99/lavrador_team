'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { nutritionApi, MealPlanDto, MealPlanDayDto } from '../../../../lib/api/nutrition.api';

const DAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAY_SHORT  = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function todayDow() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function MacroPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
      <span className="label-category text-secondary">{label}</span>
      <span className={`font-headline font-bold text-base ${color}`}>{Math.round(value)}</span>
      <span className="label-category text-secondary">{unit}</span>
    </div>
  );
}

function DayView({ day }: { day: MealPlanDayDto | undefined }) {
  if (!day || day.meals.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-2 block">no_meals</span>
        <p className="text-sm text-secondary">Sem refeições para este dia.</p>
      </div>
    );
  }

  const totals = day.meals.reduce(
    (acc, meal) => {
      meal.items.forEach((item) => {
        acc.kcal    += item.kcal;
        acc.protein += item.protein;
        acc.carbs   += item.carbs;
        acc.fat     += item.fat;
      });
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Daily summary */}
      <div className="bg-surface-container-lowest rounded-2xl px-5 py-4 shadow-sm">
        <p className="label-category text-secondary mb-3">Resumo do dia</p>
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
            <span className="label-category text-secondary">kcal</span>
            <span className="font-headline font-bold text-xl text-on-surface">{Math.round(totals.kcal)}</span>
            <span className="label-category text-secondary">kcal</span>
          </div>
          <div className="w-px h-10 bg-outline-variant/20" />
          <MacroPill label="Prot." value={totals.protein} unit="g" color="text-blue-500" />
          <MacroPill label="Carbs" value={totals.carbs}   unit="g" color="text-amber-500" />
          <MacroPill label="Gord." value={totals.fat}     unit="g" color="text-rose-500" />
        </div>
      </div>

      {/* Meals */}
      {day.meals.map((meal) => {
        const mealKcal = meal.items.reduce((s, i) => s + i.kcal, 0);
        return (
          <div key={meal.id} className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/10">
              <div>
                <span className="font-headline font-bold text-sm text-on-surface">{meal.name}</span>
              </div>
              <span className="label-category text-primary font-bold">{Math.round(mealKcal)} kcal</span>
            </div>
            <div className="divide-y divide-outline-variant/5">
              {meal.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="font-body text-sm font-medium text-on-surface">{item.foodName}</p>
                    <p className="label-category text-secondary mt-0.5">{item.grams}g</p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-label text-xs text-on-surface font-semibold">{Math.round(item.kcal)}</span>
                      <span className="label-category text-secondary">kcal</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="label-category text-blue-500">{Math.round(item.protein)}P</span>
                      <span className="label-category text-amber-500">{Math.round(item.carbs)}C</span>
                      <span className="label-category text-rose-500">{Math.round(item.fat)}G</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function NutritionPage() {
  const { data: plan, isLoading, error } = useSWR<MealPlanDto | null>('my-nutrition-plan', nutritionApi.getMyPlan);
  const [selectedDow, setSelectedDow] = useState(todayDow);

  if (isLoading) return <div className="py-20 text-sm text-secondary text-center">A carregar o plano...</div>;
  if (error)     return <div className="py-20 text-sm text-error text-center">Não foi possível carregar o plano.</div>;
  if (!plan) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-4xl text-outline mb-3 block">restaurant</span>
        <p className="text-sm text-secondary">Ainda não tens plano alimentar.<br />Fala com o teu treinador para começar!</p>
      </div>
    );
  }

  const activeDays = new Set(plan.days.map((d) => d.dayOfWeek));
  const currentDay = plan.days.find((d) => d.dayOfWeek === selectedDow);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="label-category text-primary">Nutrição</span>
        <div className="mt-1">
          <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">{plan.name}</h1>
          {plan.notes && <p className="text-sm text-secondary mt-1">{plan.notes}</p>}
          <p className="text-xs text-secondary mt-1">
            Desde {new Date(plan.startDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}
            {plan.endDate ? ` · até ${new Date(plan.endDate).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long' })}` : ''}
          </p>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {DAY_SHORT.map((label, dow) => {
          const isToday  = dow === todayDow();
          const isActive = dow === selectedDow;
          const hasData  = activeDays.has(dow);
          return (
            <button
              key={dow}
              onClick={() => setSelectedDow(dow)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl flex-shrink-0 transition-all ${
                isActive
                  ? 'bg-primary text-on-primary'
                  : isToday
                  ? 'bg-surface-container-high text-on-surface'
                  : 'bg-surface-container-low text-secondary'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hasData
                    ? isActive ? 'bg-on-primary' : 'bg-primary'
                    : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Day label */}
      <p className="font-headline font-bold text-base text-on-surface mb-3">{DAY_LABELS[selectedDow]}</p>

      {/* Day content */}
      <DayView day={currentDay} />
    </div>
  );
}
