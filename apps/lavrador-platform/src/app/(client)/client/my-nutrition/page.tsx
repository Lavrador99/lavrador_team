'use client';
import { useEffect, useState } from 'react';
import { nutritionApi, MealPlanDto } from '../../../../lib/api/nutrition.api';

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const todayDow = new Date().getDay();

export default function MyNutritionPage() {
  const [plan, setPlan] = useState<MealPlanDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayDow);

  useEffect(() => {
    nutritionApi.getMyPlan().then(setPlan).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 font-mono text-sm text-muted text-center">A carregar plano nutricional...</div>;

  if (!plan) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-syne font-black text-2xl text-white">A minha nutrição</h1>
          <p className="font-mono text-xs text-muted mt-1">// Plano alimentar</p>
        </div>
        <div className="py-16 font-mono text-sm text-muted text-center leading-relaxed">
          Ainda não tens um plano nutricional.<br />Fala com o teu treinador!
        </div>
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

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-syne font-black text-2xl text-white">A minha nutrição</h1>
        <p className="font-mono text-xs text-muted mt-1">// {plan.name}</p>
      </div>

      {/* Day picker */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[...plan.days].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((d) => (
          <button key={d.dayOfWeek} onClick={() => setSelectedDay(d.dayOfWeek)}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              selectedDay === d.dayOfWeek ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-white'
            }`}>
            {DAY_LABELS[d.dayOfWeek].slice(0, 3)}
          </button>
        ))}
      </div>

      {!selectedDayData ? (
        <div className="py-10 font-mono text-sm text-muted text-center">Sem dados para este dia.</div>
      ) : (
        <>
          {/* Macro summary */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {[
              { label: 'kcal', val: Math.round(dayKcal), color: '#c8f542' },
              { label: 'proteína', val: `${macros.protein.toFixed(1)}g`, color: '#42a5f5' },
              { label: 'hidratos', val: `${macros.carbs.toFixed(1)}g`, color: '#ff8c5a' },
              { label: 'gordura', val: `${macros.fat.toFixed(1)}g`, color: '#a855f7' },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-panel border border-border rounded-xl p-3 text-center" style={{ borderTop: `2px solid ${color}` }}>
                <div className="font-syne font-black text-xl text-white">{val}</div>
                <div className="font-mono text-[9px] text-muted uppercase tracking-widest mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Meals */}
          <div className="flex flex-col gap-3">
            {selectedDayData.meals.map((meal) => (
              <div key={meal.id} className="bg-panel border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#0d0d13]">
                  <span className="font-syne font-bold text-sm text-white">{meal.name}</span>
                  <span className="font-mono text-xs text-accent">{Math.round(meal.kcal)} kcal</span>
                </div>
                <div className="py-1">
                  {meal.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 border-b border-border/50 last:border-0">
                      <span className="flex-1 font-sans text-sm text-white">{item.foodName}</span>
                      <span className="font-mono text-[10px] text-muted">{item.grams}g</span>
                      <span className="font-mono text-[10px] text-faint min-w-[50px] text-right">{Math.round(item.kcal)} kcal</span>
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
