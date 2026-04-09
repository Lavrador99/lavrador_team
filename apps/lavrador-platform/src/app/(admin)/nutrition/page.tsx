'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { nutritionApi, MealPlanDto, MealItem } from '../../../lib/api/nutrition.api';
import { clientsApi } from '../../../lib/api/clients.api';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const emptyItem = (): MealItem => ({ foodName: '', grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 });

export default function NutritionPage() {
  const { data: clients = [] } = useSWR('clients-all', clientsApi.getAll);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [plans, setPlans] = useState<MealPlanDto[]>([]);
  const [activePlan, setActivePlan] = useState<MealPlanDto | null>(null);
  const [activeDay, setActiveDay] = useState(0);

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planStart, setPlanStart] = useState(new Date().toISOString().split('T')[0]);
  const [savingPlan, setSavingPlan] = useState(false);

  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState<MealItem[]>([emptyItem()]);
  const [savingMeal, setSavingMeal] = useState(false);

  async function loadPlans(clientId: string) {
    setSelectedClientId(clientId);
    setActivePlan(null);
    if (!clientId) { setPlans([]); return; }
    const data = await nutritionApi.getPlansByClient(clientId);
    setPlans(data);
  }

  async function refreshPlan(id: string) {
    const plan = await nutritionApi.getPlan(id);
    setActivePlan(plan);
    setPlans(prev => prev.map(p => p.id === id ? plan : p));
  }

  async function handleCreatePlan() {
    if (!planName.trim() || !selectedClientId) return;
    setSavingPlan(true);
    try {
      const plan = await nutritionApi.createPlan({ clientId: selectedClientId, name: planName.trim(), startDate: planStart });
      setPlans(prev => [...prev, plan]);
      setPlanName(''); setShowCreatePlan(false);
    } finally { setSavingPlan(false); }
  }

  async function handleAddMeal() {
    if (!activePlan || !mealName.trim()) return;
    const day = activePlan.days[activeDay];
    if (!day) return;
    setSavingMeal(true);
    try {
      await nutritionApi.addMeal(day.id, mealName, mealItems.filter(i => i.foodName));
      await refreshPlan(activePlan.id);
      setMealName(''); setMealItems([emptyItem()]); setShowAddMeal(false);
    } finally { setSavingMeal(false); }
  }

  async function handleDeleteMeal(mealId: string) {
    if (!activePlan || !window.confirm('Eliminar refeição?')) return;
    await nutritionApi.deleteMeal(mealId);
    await refreshPlan(activePlan.id);
  }

  const inputCls = 'w-full bg-[#0d0d13] border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent';
  const selectedDay = activePlan?.days[activeDay];
  const dayKcal = selectedDay?.meals.reduce((s, m) => s + m.kcal, 0) ?? 0;

  return (
    <div>
      <h1 className="font-syne font-black text-2xl text-white mb-6">Nutrição</h1>

      {/* Client selector */}
      <div className="mb-5">
        <select value={selectedClientId} onChange={e => loadPlans(e.target.value)}
          className={inputCls + ' max-w-xs'}>
          <option value="">Seleccionar cliente</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.client?.id ?? c.id}>{c.client?.name ?? c.email}</option>
          ))}
        </select>
      </div>

      {selectedClientId && (
        <>
          {/* Plan list */}
          <div className="flex gap-2 flex-wrap mb-4">
            {plans.map(p => (
              <button key={p.id} onClick={() => setActivePlan(p)}
                className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${activePlan?.id === p.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-white'}`}>
                {p.name}
              </button>
            ))}
            <button onClick={() => setShowCreatePlan(!showCreatePlan)}
              className="font-mono text-xs px-3 py-1.5 rounded-lg border border-dashed border-border text-muted hover:text-white hover:border-muted transition-colors">
              + Plano
            </button>
          </div>

          {showCreatePlan && (
            <div className="bg-panel border border-border rounded-xl p-4 mb-4 flex gap-3 flex-wrap items-end">
              <div className="flex-1">
                <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Nome</label>
                <input value={planName} onChange={e => setPlanName(e.target.value)} className={inputCls} placeholder="Plano de manutenção" />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Início</label>
                <input type="date" value={planStart} onChange={e => setPlanStart(e.target.value)} className={inputCls} />
              </div>
              <button onClick={handleCreatePlan} disabled={savingPlan || !planName} className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                {savingPlan ? '...' : 'Criar'}
              </button>
            </div>
          )}

          {activePlan && (
            <>
              {/* Day tabs */}
              <div className="flex gap-1.5 mb-4 overflow-x-auto">
                {activePlan.days.map((d, i) => (
                  <button key={d.id} onClick={() => setActiveDay(i)}
                    className={`font-mono text-xs px-3 py-1.5 rounded-lg border flex-shrink-0 transition-colors ${activeDay === i ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-white'}`}>
                    {DAY_LABELS[d.dayOfWeek] ?? `Dia ${d.dayOfWeek + 1}`}
                  </button>
                ))}
              </div>

              {/* Day summary */}
              {selectedDay && (
                <div className="mb-4">
                  <div className="font-mono text-xs text-muted mb-3">Total: <span className="text-accent font-bold">{dayKcal} kcal</span></div>
                  <div className="flex flex-col gap-3">
                    {selectedDay.meals.map(meal => (
                      <div key={meal.id} className="bg-panel border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                          <div>
                            <div className="font-sans font-semibold text-sm text-white">{meal.name}</div>
                            <div className="font-mono text-[10px] text-muted mt-0.5">{meal.kcal} kcal</div>
                          </div>
                          <button onClick={() => handleDeleteMeal(meal.id)} className="font-mono text-xs text-red-400 hover:text-red-300">✕</button>
                        </div>
                        <div className="px-4 py-2 flex flex-col gap-1">
                          {meal.items.map((item, i) => (
                            <div key={i} className="flex justify-between font-mono text-[10px] text-muted">
                              <span>{item.foodName} ({item.grams}g)</span>
                              <span>{item.kcal} kcal · P:{item.protein}g C:{item.carbs}g G:{item.fat}g</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => setShowAddMeal(true)} className="mt-3 w-full font-mono text-xs text-muted border border-dashed border-border rounded-xl py-3 hover:text-white hover:border-muted transition-colors">
                    + Adicionar refeição
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add meal modal */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddMeal(false)}>
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="font-syne font-black text-lg text-white">Nova refeição</div>
            <div>
              <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-1">Nome</label>
              <input value={mealName} onChange={e => setMealName(e.target.value)} className={inputCls} placeholder="Pequeno-almoço" />
            </div>
            {mealItems.map((item, i) => (
              <div key={i} className="bg-[#0d0d13] border border-border rounded-xl p-3 space-y-2">
                <input value={item.foodName} onChange={e => { const arr = [...mealItems]; arr[i] = { ...arr[i], foodName: e.target.value }; setMealItems(arr); }}
                  className={inputCls} placeholder="Alimento" />
                <div className="grid grid-cols-3 gap-2">
                  {(['grams', 'kcal', 'protein', 'carbs', 'fat'] as const).map(field => (
                    <div key={field}>
                      <label className="font-mono text-[9px] text-faint uppercase tracking-widest block mb-0.5">{field}</label>
                      <input type="number" min={0} value={item[field]}
                        onChange={e => { const arr = [...mealItems]; arr[i] = { ...arr[i], [field]: Number(e.target.value) }; setMealItems(arr); }}
                        className={inputCls + ' text-xs'} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setMealItems(prev => [...prev, emptyItem()])} className="font-mono text-xs text-muted hover:text-white border border-dashed border-border rounded-lg py-2 w-full">
              + Alimento
            </button>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddMeal(false)} className="font-sans text-sm text-muted hover:text-white px-4 py-2">Cancelar</button>
              <button onClick={handleAddMeal} disabled={savingMeal || !mealName} className="bg-accent text-dark font-syne font-black text-sm px-5 py-2 rounded-lg disabled:opacity-50">
                {savingMeal ? '...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
