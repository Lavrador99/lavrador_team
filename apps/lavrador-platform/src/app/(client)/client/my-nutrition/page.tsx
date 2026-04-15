'use client';
import { useEffect, useState } from 'react';
import { nutritionApi, MealPlanDto } from '../../../../lib/api/nutrition.api';

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const todayDow = new Date().getDay();

const MACROS = [
  { label: 'kcal',      color: '#84d4d3', key: 'kcal' as const },
  { label: 'Proteína',  color: '#60a5fa', key: 'protein' as const },
  { label: 'Hidratos',  color: '#fb923c', key: 'carbs' as const },
  { label: 'Gordura',   color: '#c084fc', key: 'fat' as const },
];

export default function MyNutritionPage() {
  const [plan, setPlan] = useState<MealPlanDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayDow);

  useEffect(() => {
    nutritionApi.getMyPlan().then(setPlan).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-sm text-zinc-500 text-center">A carregar plano nutricional...</div>;

  if (!plan) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-4xl text-zinc-700 mb-3 block">restaurant</span>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Ainda não tens um plano nutricional.<br />Fala com o teu treinador!
        </p>
      </div>
    );
  }

  const selectedDayData = plan.days.find((d) => d.dayOfWeek === selectedDay);
  const dayKcal = selectedDayData?.meals.reduce((s, m) => s + m.kcal, 0) ?? 0;
  const macros = selectedDayData?.meals.reduce(
    (acc, meal) => {
      meal.items.forEach((item) => { acc.protein += item.protein; acc.carbs += item.carbs; acc.fat += item.fat; });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 },
  ) ?? { protein: 0, carbs: 0, fat: 0 };

  const macroValues: Record<string, string | number> = {
    kcal:    Math.round(dayKcal),
    protein: `${macros.protein.toFixed(0)}g`,
    carbs:   `${macros.carbs.toFixed(0)}g`,
    fat:     `${macros.fat.toFixed(0)}g`,
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">Nutrição</div>
        <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">A minha nutrição</h1>
        <p className="text-xs text-zinc-500 mt-1">{plan.name}</p>
      </div>

      {/* ── Day picker ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {[...plan.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((d) => {
          const isActive = selectedDay === d.dayOfWeek;
          return (
            <button
              key={d.dayOfWeek}
              onClick={() => setSelectedDay(d.dayOfWeek)}
              className={`font-bold text-xs px-3 py-2 rounded-xl transition-colors ${
                isActive ? 'text-black' : 'bg-zinc-900 border border-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
              style={isActive ? { background: '#c8f542' } : {}}
            >
              {DAY_LABELS[d.dayOfWeek].slice(0, 3)}
            </button>
          );
        })}
      </div>

      {!selectedDayData ? (
        <div className="py-10 text-sm text-zinc-500 text-center">Sem dados para este dia.</div>
      ) : (
        <>
          {/* ── Macro summary ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {MACROS.map(({ label, color, key }) => (
              <div key={key} className="bg-zinc-900 rounded-2xl p-3 text-center border border-zinc-800/60">
                <div className="font-[Manrope] font-black text-lg text-white">{macroValues[key]}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Meals ───────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {selectedDayData.meals.map((meal) => (
              <div key={meal.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800/60">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/60">
                  <span className="font-semibold text-sm text-white">{meal.name}</span>
                  <span className="text-xs font-bold text-[#84d4d3]">{Math.round(meal.kcal)} kcal</span>
                </div>
                <div className="py-1">
                  {meal.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/40 last:border-0">
                      <span className="flex-1 text-sm text-white">{item.foodName}</span>
                      <span className="text-xs text-zinc-500">{item.grams}g</span>
                      <span className="text-xs text-zinc-600 min-w-[48px] text-right">{Math.round(item.kcal)} kcal</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
