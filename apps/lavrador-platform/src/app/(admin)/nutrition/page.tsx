'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { nutritionApi, MealPlanDto, MealItem } from '../../../lib/api/nutrition.api';
import { clientsApi } from '../../../lib/api/clients.api';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const emptyItem = (): MealItem => ({ foodName: '', grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 });

const INPUT_CLS = 'w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-0 focus:bg-surface-container-lowest border-b-2 border-transparent focus:border-primary outline-none transition-all';

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

  const selectedDay = activePlan?.days[activeDay];
  const dayKcal = selectedDay?.meals.reduce((s, m) => s + m.kcal, 0) ?? 0;

  return (
    <div>
      <div className="mb-8">
        <span className="label-category text-primary">Planeamento</span>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mt-1">Nutrição</h1>
      </div>

      <div className="mb-6">
        <select value={selectedClientId} onChange={e => loadPlans(e.target.value)} className={INPUT_CLS + ' max-w-xs'}>
          <option value="">Seleccionar cliente</option>
          {clients.map((c: any) => (
            <option key={c.id} value={c.client?.id ?? c.id}>{c.client?.name ?? c.email}</option>
          ))}
        </select>
      </div>

      {selectedClientId && (
        <>
          {/* Plan tabs */}
          <div className="flex gap-2 flex-wrap mb-4">
            {plans.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePlan(p)}
                className={`font-label font-bold text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  activePlan?.id === p.id
                    ? 'bg-primary text-on-primary shadow-ambient'
                    : 'bg-surface-container-high text-secondary hover:text-on-surface'
                }`}
              >
                {p.name}
              </button>
            ))}
            <button
              onClick={() => setShowCreatePlan(!showCreatePlan)}
              className="font-label font-bold text-xs px-3 py-1.5 rounded-lg border border-dashed border-outline-variant text-outline hover:text-secondary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Plano
            </button>
          </div>

          {showCreatePlan && (
            <div className="bg-surface-container-lowest rounded-xl p-5 mb-5 flex gap-3 flex-wrap items-end shadow-sm">
              <div className="flex-1">
                <label className="label-category block mb-1.5">Nome</label>
                <input value={planName} onChange={e => setPlanName(e.target.value)} className={INPUT_CLS} placeholder="Plano de manutenção" />
              </div>
              <div>
                <label className="label-category block mb-1.5">Início</label>
                <input type="date" value={planStart} onChange={e => setPlanStart(e.target.value)} className={INPUT_CLS} />
              </div>
              <button
                onClick={handleCreatePlan}
                disabled={savingPlan || !planName}
                className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-3 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
              >
                {savingPlan ? '...' : 'Criar'}
              </button>
            </div>
          )}

          {activePlan && (
            <>
              {/* Day tabs */}
              <div className="flex gap-1.5 mb-5 overflow-x-auto">
                {activePlan.days.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveDay(i)}
                    className={`font-label font-bold text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                      activeDay === i
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-secondary hover:text-on-surface'
                    }`}
                  >
                    {DAY_LABELS[d.dayOfWeek] ?? `Dia ${d.dayOfWeek + 1}`}
                  </button>
                ))}
              </div>

              {selectedDay && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="label-category">Total do dia</span>
                    <span className="font-headline font-bold text-primary text-lg">{dayKcal} kcal</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {selectedDay.meals.map(meal => (
                      <div key={meal.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low">
                          <div>
                            <div className="font-headline font-bold text-sm text-on-surface">{meal.name}</div>
                            <div className="label-category mt-0.5">{meal.kcal} kcal</div>
                          </div>
                          <button onClick={() => handleDeleteMeal(meal.id)} className="text-outline hover:text-error transition-colors p-1">
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                        <div className="px-4 py-3 space-y-1.5">
                          {meal.items.map((item, i) => (
                            <div key={i} className="flex justify-between font-label text-xs text-secondary">
                              <span>{item.foodName} ({item.grams}g)</span>
                              <span className="text-outline">{item.kcal} kcal · P:{item.protein}g C:{item.carbs}g G:{item.fat}g</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddMeal(true)}
                    className="mt-4 w-full font-label font-bold text-xs text-secondary border border-dashed border-outline-variant rounded-xl py-3 hover:text-on-surface hover:border-outline transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Adicionar refeição
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Add meal modal */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-on-surface/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddMeal(false)}>
          <div className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto shadow-ambient-lg" onClick={e => e.stopPropagation()}>
            <h2 className="font-headline font-black text-xl text-on-surface">Nova refeição</h2>
            <div>
              <label className="label-category block mb-1.5">Nome</label>
              <input value={mealName} onChange={e => setMealName(e.target.value)} className={INPUT_CLS} placeholder="Pequeno-almoço" />
            </div>
            {mealItems.map((item, i) => (
              <div key={i} className="bg-surface-container-low rounded-xl p-4 space-y-3">
                <input
                  value={item.foodName}
                  onChange={e => { const arr = [...mealItems]; arr[i] = { ...arr[i], foodName: e.target.value }; setMealItems(arr); }}
                  className={INPUT_CLS}
                  placeholder="Alimento"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(['grams', 'kcal', 'protein', 'carbs', 'fat'] as const).map(field => (
                    <div key={field}>
                      <label className="label-category block mb-1">{field}</label>
                      <input
                        type="number" min={0} value={item[field]}
                        onChange={e => { const arr = [...mealItems]; arr[i] = { ...arr[i], [field]: Number(e.target.value) }; setMealItems(arr); }}
                        className={INPUT_CLS + ' text-xs'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => setMealItems(prev => [...prev, emptyItem()])}
              className="font-label font-bold text-xs text-secondary hover:text-on-surface border border-dashed border-outline-variant rounded-lg py-2 w-full flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Alimento
            </button>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowAddMeal(false)} className="text-sm text-secondary hover:text-on-surface px-4 py-2 transition-colors">Cancelar</button>
              <button
                onClick={handleAddMeal}
                disabled={savingMeal || !mealName}
                className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-6 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
              >
                {savingMeal ? '...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
