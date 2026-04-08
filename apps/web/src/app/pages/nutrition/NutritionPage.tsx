import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { clientsApi } from '../../utils/api/clients.api';
import {
  nutritionApi, MealPlanDto, MealPlanDayDto, MealItem,
} from '../../utils/api/nutrition.api';
import { UserDto } from '@libs/types';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const emptyItem = (): MealItem => ({
  foodName: '', grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0,
});

export const NutritionPage: React.FC = () => {
  const [clients, setClients] = useState<UserDto[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [plans, setPlans] = useState<MealPlanDto[]>([]);
  const [activePlan, setActivePlan] = useState<MealPlanDto | null>(null);
  const [activeDay, setActiveDay] = useState(0);

  // Create plan form
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planStart, setPlanStart] = useState(new Date().toISOString().split('T')[0]);
  const [savingPlan, setSavingPlan] = useState(false);

  // Add meal modal
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [mealItems, setMealItems] = useState<MealItem[]>([emptyItem()]);
  const [savingMeal, setSavingMeal] = useState(false);

  useEffect(() => {
    clientsApi.getAll().then((us) => setClients(us.filter((u) => u.role === 'CLIENT')));
  }, []);

  useEffect(() => {
    if (!selectedClientId) { setPlans([]); setActivePlan(null); return; }
    nutritionApi.getPlansByClient(selectedClientId).then(setPlans).catch(() => setPlans([]));
    setActivePlan(null);
  }, [selectedClientId]);

  const refreshPlan = async (id: string) => {
    const plan = await nutritionApi.getPlan(id);
    setActivePlan(plan);
    setPlans((prev) => prev.map((p) => (p.id === id ? plan : p)));
  };

  const handleCreatePlan = async () => {
    if (!planName.trim() || !selectedClientId) return;
    setSavingPlan(true);
    try {
      const plan = await nutritionApi.createPlan({
        clientId: selectedClientId,
        name: planName.trim(),
        startDate: planStart,
      });
      setPlans((prev) => [...prev, plan]);
      setActivePlan(plan);
      setShowCreatePlan(false);
      setPlanName('');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Eliminar este plano?')) return;
    await nutritionApi.deletePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (activePlan?.id === id) setActivePlan(null);
  };

  // ── Day & Meal helpers ─────────────────────────────────────────────────────

  const currentDay = (): MealPlanDayDto | undefined =>
    activePlan?.days.find((d) => d.dayOfWeek === activeDay);

  const openAddMeal = () => {
    setEditingMealId(null);
    setMealName('');
    setMealItems([emptyItem()]);
    setShowAddMeal(true);
  };

  const openEditMeal = (mealId: string) => {
    const day = currentDay();
    const meal = day?.meals.find((m) => m.id === mealId);
    if (!meal) return;
    setEditingMealId(mealId);
    setMealName(meal.name);
    setMealItems(meal.items.length ? meal.items : [emptyItem()]);
    setShowAddMeal(true);
  };

  const handleSaveMeal = async () => {
    if (!mealName.trim() || !activePlan) return;
    setSavingMeal(true);
    try {
      const validItems = mealItems.filter((i) => i.foodName.trim());
      // Ensure day exists first
      let day = currentDay();
      if (!day) {
        day = await nutritionApi.upsertDay(activePlan.id, activeDay, DAY_LABELS[activeDay]);
      }
      if (editingMealId) {
        await nutritionApi.updateMeal(editingMealId, mealName.trim(), validItems);
      } else {
        await nutritionApi.addMeal(day.id, mealName.trim(), validItems);
      }
      await refreshPlan(activePlan.id);
      setShowAddMeal(false);
    } finally {
      setSavingMeal(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!activePlan || !window.confirm('Eliminar esta refeição?')) return;
    await nutritionApi.deleteMeal(mealId);
    await refreshPlan(activePlan.id);
  };

  const updateItem = (idx: number, field: keyof MealItem, value: string | number) => {
    setMealItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addItemRow = () => setMealItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (idx: number) => setMealItems((prev) => prev.filter((_, i) => i !== idx));

  // Macro totals for the active day
  const dayMacros = () => {
    const day = currentDay();
    if (!day) return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    return day.meals.reduce(
      (acc, meal) => {
        meal.items.forEach((item) => {
          acc.kcal += item.kcal;
          acc.protein += item.protein;
          acc.carbs += item.carbs;
          acc.fat += item.fat;
        });
        return acc;
      },
      { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    );
  };

  const clientName = (id: string) => {
    const u = clients.find((c) => c.id === id);
    return u?.client?.name ?? u?.email ?? id;
  };

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Nutrição</PageTitle>
          <PageSubtitle>// Planos alimentares dos clientes</PageSubtitle>
        </div>
      </PageHeader>

      {/* Client selector */}
      <Row>
        <ClientSelect value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
          <option value="">Selecionar cliente...</option>
          {clients.map((u) => (
            <option key={u.id} value={u.id}>
              {u.client?.name ?? u.email}
            </option>
          ))}
        </ClientSelect>
      </Row>

      {selectedClientId && (
        <Layout>
          {/* Sidebar — plan list */}
          <PlanSidebar>
            <SidebarLabel>PLANOS</SidebarLabel>
            {plans.length === 0 ? (
              <SidebarEmpty>Sem planos ainda.</SidebarEmpty>
            ) : (
              plans.map((p) => (
                <PlanRow key={p.id} $active={activePlan?.id === p.id} onClick={() => setActivePlan(p)}>
                  <PlanRowName>{p.name}</PlanRowName>
                  <PlanRowDate>{new Date(p.startDate).toLocaleDateString('pt-PT')}</PlanRowDate>
                  <DeletePlanBtn onClick={(e) => { e.stopPropagation(); handleDeletePlan(p.id); }}>✕</DeletePlanBtn>
                </PlanRow>
              ))
            )}
            {showCreatePlan ? (
              <CreatePlanForm>
                <FormInput
                  placeholder="Nome do plano"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlan()}
                  autoFocus
                />
                <FormInput
                  type="date"
                  value={planStart}
                  onChange={(e) => setPlanStart(e.target.value)}
                />
                <FormBtnRow>
                  <SaveBtn disabled={savingPlan || !planName.trim()} onClick={handleCreatePlan}>
                    {savingPlan ? '...' : 'Criar'}
                  </SaveBtn>
                  <CancelBtn onClick={() => setShowCreatePlan(false)}>Cancelar</CancelBtn>
                </FormBtnRow>
              </CreatePlanForm>
            ) : (
              <NewPlanBtn onClick={() => setShowCreatePlan(true)}>+ Novo plano</NewPlanBtn>
            )}
          </PlanSidebar>

          {/* Main editor */}
          <PlanEditor>
            {!activePlan ? (
              <EmptyEditor>Seleciona ou cria um plano</EmptyEditor>
            ) : (
              <>
                <EditorHeader>
                  <EditorTitle>{activePlan.name}</EditorTitle>
                  <EditorFor>para {clientName(activePlan.clientId)}</EditorFor>
                </EditorHeader>

                {/* Day tabs */}
                <DayTabs>
                  {DAY_LABELS.map((label, i) => {
                    const hasContent = activePlan.days.some((d) => d.dayOfWeek === i && d.meals.length > 0);
                    return (
                      <DayTab key={i} $active={activeDay === i} $hasContent={hasContent} onClick={() => setActiveDay(i)}>
                        {label}
                        {hasContent && <DayDot />}
                      </DayTab>
                    );
                  })}
                </DayTabs>

                {/* Day macros summary */}
                {(() => {
                  const m = dayMacros();
                  return m.kcal > 0 ? (
                    <MacroRow>
                      <MacroChip $color="#c8f542">{Math.round(m.kcal)} kcal</MacroChip>
                      <MacroChip $color="#42a5f5">{Math.round(m.protein)}g P</MacroChip>
                      <MacroChip $color="#ff8c5a">{Math.round(m.carbs)}g C</MacroChip>
                      <MacroChip $color="#c084fc">{Math.round(m.fat)}g G</MacroChip>
                    </MacroRow>
                  ) : null;
                })()}

                {/* Meals for active day */}
                <MealsArea>
                  {(currentDay()?.meals ?? []).length === 0 ? (
                    <EmptyDay>Sem refeições para {DAY_LABELS[activeDay]}. Adiciona abaixo.</EmptyDay>
                  ) : (
                    (currentDay()?.meals ?? []).map((meal) => (
                      <MealCard key={meal.id}>
                        <MealCardHeader>
                          <MealCardName>{meal.name}</MealCardName>
                          <MealCardKcal>{Math.round(meal.kcal)} kcal</MealCardKcal>
                          <MealEditBtn onClick={() => openEditMeal(meal.id)}>Editar</MealEditBtn>
                          <MealDeleteBtn onClick={() => handleDeleteMeal(meal.id)}>✕</MealDeleteBtn>
                        </MealCardHeader>
                        {meal.items.length > 0 && (
                          <FoodTable>
                            <thead>
                              <tr>
                                <FoodTh>Alimento</FoodTh>
                                <FoodTh>g</FoodTh>
                                <FoodTh>kcal</FoodTh>
                                <FoodTh>P</FoodTh>
                                <FoodTh>C</FoodTh>
                                <FoodTh>G</FoodTh>
                              </tr>
                            </thead>
                            <tbody>
                              {meal.items.map((item, i) => (
                                <tr key={i}>
                                  <FoodTd>{item.foodName}</FoodTd>
                                  <FoodTd>{item.grams}</FoodTd>
                                  <FoodTd>{Math.round(item.kcal)}</FoodTd>
                                  <FoodTd>{Math.round(item.protein)}</FoodTd>
                                  <FoodTd>{Math.round(item.carbs)}</FoodTd>
                                  <FoodTd>{Math.round(item.fat)}</FoodTd>
                                </tr>
                              ))}
                            </tbody>
                          </FoodTable>
                        )}
                      </MealCard>
                    ))
                  )}
                  <AddMealBtn onClick={openAddMeal}>+ Adicionar refeição</AddMealBtn>
                </MealsArea>
              </>
            )}
          </PlanEditor>
        </Layout>
      )}

      {/* Add/Edit meal modal */}
      {showAddMeal && (
        <ModalOverlay onClick={() => setShowAddMeal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingMealId ? 'Editar refeição' : 'Nova refeição'}</ModalTitle>
              <ModalClose onClick={() => setShowAddMeal(false)}>✕</ModalClose>
            </ModalHeader>

            <ModalBody>
              <FieldLabel>Nome da refeição</FieldLabel>
              <FormInput
                placeholder="Ex: Pequeno-almoço"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                autoFocus
              />

              <FieldLabel style={{ marginTop: 16 }}>Alimentos</FieldLabel>
              <FoodTable>
                <thead>
                  <tr>
                    <FoodTh style={{ width: '30%' }}>Alimento</FoodTh>
                    <FoodTh>g</FoodTh>
                    <FoodTh>kcal</FoodTh>
                    <FoodTh>P</FoodTh>
                    <FoodTh>C</FoodTh>
                    <FoodTh>G</FoodTh>
                    <FoodTh />
                  </tr>
                </thead>
                <tbody>
                  {mealItems.map((item, idx) => (
                    <tr key={idx}>
                      <FoodTd>
                        <InlineInput
                          placeholder="Nome"
                          value={item.foodName}
                          onChange={(e) => updateItem(idx, 'foodName', e.target.value)}
                        />
                      </FoodTd>
                      {(['grams', 'kcal', 'protein', 'carbs', 'fat'] as (keyof MealItem)[]).map((field) => (
                        <FoodTd key={field}>
                          <InlineInput
                            type="number"
                            min="0"
                            placeholder="0"
                            value={(item[field] as number) || ''}
                            onChange={(e) => updateItem(idx, field, parseFloat(e.target.value) || 0)}
                            style={{ width: 52 }}
                          />
                        </FoodTd>
                      ))}
                      <FoodTd>
                        <RemoveRowBtn onClick={() => removeItemRow(idx)}>✕</RemoveRowBtn>
                      </FoodTd>
                    </tr>
                  ))}
                </tbody>
              </FoodTable>
              <AddRowBtn onClick={addItemRow}>+ linha</AddRowBtn>
            </ModalBody>

            <ModalFooter>
              <SaveBtn disabled={savingMeal || !mealName.trim()} onClick={handleSaveMeal}>
                {savingMeal ? 'A guardar...' : 'Guardar refeição'}
              </SaveBtn>
              <CancelBtn onClick={() => setShowAddMeal(false)}>Cancelar</CancelBtn>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

const Page = styled.div`padding:36px 32px;max-width:1100px;animation:${fadeIn} .25s ease;`;
const PageHeader = styled.div`margin-bottom:24px;`;
const PageTitle = styled.h1`font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#e8e8f0;`;
const PageSubtitle = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#666677;margin-top:4px;`;
const Row = styled.div`margin-bottom:24px;`;
const ClientSelect = styled.select`background:#111118;border:1px solid #2a2a35;color:#e8e8f0;font-family:'DM Mono',monospace;font-size:13px;padding:10px 16px;border-radius:8px;min-width:280px;outline:none;&:focus{border-color:#c8f542;}`;

const Layout = styled.div`display:flex;gap:20px;align-items:flex-start;`;
const PlanSidebar = styled.div`width:220px;flex-shrink:0;background:#111118;border:1px solid #1e1e28;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:4px;`;
const SidebarLabel = styled.div`font-family:'DM Mono',monospace;font-size:9px;letter-spacing:2px;color:#444455;padding:4px 8px;margin-bottom:4px;`;
const SidebarEmpty = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#444455;padding:8px;`;
const PlanRow = styled.div<{ $active: boolean }>`display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:6px;cursor:pointer;background:${p=>p.$active?'rgba(200,245,66,0.08)':'transparent'};border:1px solid ${p=>p.$active?'rgba(200,245,66,0.2)':'transparent'};transition:all .15s;&:hover{background:rgba(200,245,66,0.05);}`;
const PlanRowName = styled.div`font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;color:#e8e8f0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;`;
const PlanRowDate = styled.div`font-family:'DM Mono',monospace;font-size:9px;color:#444455;flex-shrink:0;`;
const DeletePlanBtn = styled.button`background:none;border:none;color:#444455;cursor:pointer;font-size:10px;padding:2px 4px;flex-shrink:0;&:hover{color:#ff6b6b;}`;
const NewPlanBtn = styled.button`margin-top:8px;width:100%;background:rgba(200,245,66,0.06);border:1px dashed rgba(200,245,66,0.2);color:#c8f542;border-radius:6px;padding:8px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;transition:all .15s;&:hover{background:rgba(200,245,66,0.12);}`;
const CreatePlanForm = styled.div`margin-top:8px;display:flex;flex-direction:column;gap:6px;`;
const FormInput = styled.input`background:#0a0a0f;border:1px solid #2a2a35;color:#e8e8f0;font-family:'DM Mono',monospace;font-size:12px;padding:7px 10px;border-radius:6px;outline:none;width:100%;box-sizing:border-box;&:focus{border-color:#c8f542;}&::placeholder{color:#333342;}`;
const FormBtnRow = styled.div`display:flex;gap:6px;`;
const SaveBtn = styled.button`background:#c8f542;color:#0a0a0f;border:none;border-radius:6px;padding:8px 16px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;flex:1;&:disabled{opacity:.5;cursor:not-allowed;}&:hover:not(:disabled){background:#d4ff55;}`;
const CancelBtn = styled.button`background:transparent;border:1px solid #2a2a35;color:#666677;border-radius:6px;padding:8px 12px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;&:hover{color:#e8e8f0;}`;

const PlanEditor = styled.div`flex:1;min-width:0;`;
const EmptyEditor = styled.div`padding:60px 0;text-align:center;font-family:'DM Mono',monospace;font-size:13px;color:#444455;`;
const EditorHeader = styled.div`display:flex;align-items:baseline;gap:12px;margin-bottom:16px;`;
const EditorTitle = styled.div`font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#e8e8f0;`;
const EditorFor = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#666677;`;
const DayTabs = styled.div`display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #1e1e28;padding-bottom:0;`;
const DayTab = styled.button<{ $active: boolean; $hasContent: boolean }>`position:relative;background:none;border:none;border-bottom:2px solid ${p=>p.$active?'#c8f542':'transparent'};color:${p=>p.$active?'#c8f542':p.$hasContent?'#e8e8f0':'#444455'};padding:8px 14px;cursor:pointer;font-family:'DM Mono',monospace;font-size:12px;font-weight:${p=>p.$active?'700':'400'};transition:all .15s;&:hover{color:#e8e8f0;}`;
const DayDot = styled.div`position:absolute;top:6px;right:6px;width:4px;height:4px;border-radius:50%;background:#c8f542;`;
const MacroRow = styled.div`display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;`;
const MacroChip = styled.span<{ $color: string }>`font-family:'DM Mono',monospace;font-size:11px;padding:4px 10px;border-radius:4px;background:${p=>p.$color}18;border:1px solid ${p=>p.$color}33;color:${p=>p.$color};`;
const MealsArea = styled.div`display:flex;flex-direction:column;gap:10px;`;
const EmptyDay = styled.div`font-family:'DM Mono',monospace;font-size:12px;color:#444455;padding:20px 0;`;
const MealCard = styled.div`background:#111118;border:1px solid #1e1e28;border-radius:10px;padding:14px 16px;`;
const MealCardHeader = styled.div`display:flex;align-items:center;gap:10px;margin-bottom:10px;`;
const MealCardName = styled.div`font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e8e8f0;flex:1;`;
const MealCardKcal = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#c8f542;`;
const MealEditBtn = styled.button`background:none;border:1px solid #2a2a35;color:#666677;border-radius:4px;padding:3px 8px;font-family:'DM Mono',monospace;font-size:10px;cursor:pointer;&:hover{border-color:#c8f542;color:#c8f542;}`;
const MealDeleteBtn = styled.button`background:none;border:none;color:#444455;cursor:pointer;font-size:12px;&:hover{color:#ff6b6b;}`;
const FoodTable = styled.table`width:100%;border-collapse:collapse;font-family:'DM Mono',monospace;font-size:11px;`;
const FoodTh = styled.th`text-align:left;color:#444455;font-weight:400;padding:4px 6px;border-bottom:1px solid #1e1e28;`;
const FoodTd = styled.td`padding:4px 6px;color:#888899;`;
const AddMealBtn = styled.button`width:100%;background:rgba(200,245,66,0.04);border:1px dashed rgba(200,245,66,0.15);color:#666677;border-radius:8px;padding:12px;font-family:'DM Mono',monospace;font-size:12px;cursor:pointer;transition:all .15s;&:hover{background:rgba(200,245,66,0.08);color:#c8f542;border-color:rgba(200,245,66,0.3);}`;

// Modal
const ModalOverlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;`;
const Modal = styled.div`background:#111118;border:1px solid #2a2a35;border-radius:12px;width:700px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;`;
const ModalHeader = styled.div`display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #1e1e28;`;
const ModalTitle = styled.div`font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:#e8e8f0;`;
const ModalClose = styled.button`background:none;border:none;color:#444455;font-size:18px;cursor:pointer;&:hover{color:#e8e8f0;}`;
const ModalBody = styled.div`padding:20px;overflow-y:auto;flex:1;`;
const ModalFooter = styled.div`display:flex;gap:10px;padding:16px 20px;border-top:1px solid #1e1e28;`;
const FieldLabel = styled.div`font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;color:#444455;margin-bottom:6px;`;
const InlineInput = styled.input`background:#0d0d13;border:1px solid #2a2a35;color:#e8e8f0;font-family:'DM Mono',monospace;font-size:11px;padding:5px 7px;border-radius:4px;width:100%;box-sizing:border-box;outline:none;&:focus{border-color:#c8f542;}&::placeholder{color:#333342;}`;
const AddRowBtn = styled.button`margin-top:8px;background:none;border:none;color:#c8f542;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;padding:4px 0;&:hover{text-decoration:underline;}`;
const RemoveRowBtn = styled.button`background:none;border:none;color:#444455;cursor:pointer;font-size:11px;&:hover{color:#ff6b6b;}`;
