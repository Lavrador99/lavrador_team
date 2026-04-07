import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { nutritionApi, MealPlanDto } from '../../utils/api/nutrition.api';
import { pdf } from '@react-pdf/renderer';
import { NutritionPlanPdf } from '../../utils/pdf/NutritionPlanPdf';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const todayDow = new Date().getDay();

export const MyNutritionPage: React.FC = () => {
  const { user } = useSelector((s: RootState) => s.auth);
  const [plan, setPlan] = useState<MealPlanDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(todayDow);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    nutritionApi.getMyPlan()
      .then(setPlan)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleExportPdf = async () => {
    if (!plan) return;
    setExportingPdf(true);
    try {
      const blob = await pdf(
        <NutritionPlanPdf data={{
          clientName: user?.email?.split('@')[0] ?? 'Cliente',
          planName: plan.name,
          days: plan.days.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            meals: d.meals.map((m) => ({ name: m.name, kcal: m.kcal, items: m.items })),
          })),
        }} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plano-nutricional.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) return <Page><LoadingText>A carregar plano nutricional...</LoadingText></Page>;

  if (!plan) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>A minha nutrição</PageTitle>
          <PageSubtitle>// Plano alimentar</PageSubtitle>
        </PageHeader>
        <Empty>
          Ainda não tens um plano nutricional.<br />
          Fala com o teu treinador!
        </Empty>
      </Page>
    );
  }

  const selectedDayData = plan.days.find((d) => d.dayOfWeek === selectedDay);
  const dayTotalKcal = selectedDayData?.meals.reduce((s, m) => s + m.kcal, 0) ?? 0;

  const macros = selectedDayData?.meals.reduce(
    (acc, meal) => {
      meal.items.forEach((item) => {
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
      });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  ) ?? { protein: 0, carbs: 0, fat: 0 };

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>A minha nutrição</PageTitle>
          <PageSubtitle>// {plan.name}</PageSubtitle>
        </div>
        <PdfBtn onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? '...' : '↓ PDF'}
        </PdfBtn>
      </PageHeader>

      {/* Day picker */}
      <DayPicker>
        {plan.days.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((d) => (
          <DayTab
            key={d.dayOfWeek}
            $active={selectedDay === d.dayOfWeek}
            onClick={() => setSelectedDay(d.dayOfWeek)}
          >
            {DAY_LABELS[d.dayOfWeek].slice(0, 3)}
          </DayTab>
        ))}
      </DayPicker>

      {!selectedDayData ? (
        <Empty>Sem dados para este dia.</Empty>
      ) : (
        <>
          {/* Macro summary */}
          <MacroRow>
            <MacroCard $color="#c8f542">
              <MacroVal>{Math.round(dayTotalKcal)}</MacroVal>
              <MacroLabel>kcal</MacroLabel>
            </MacroCard>
            <MacroCard $color="#42a5f5">
              <MacroVal>{macros.protein.toFixed(1)}g</MacroVal>
              <MacroLabel>proteína</MacroLabel>
            </MacroCard>
            <MacroCard $color="#ff8c5a">
              <MacroVal>{macros.carbs.toFixed(1)}g</MacroVal>
              <MacroLabel>hidratos</MacroLabel>
            </MacroCard>
            <MacroCard $color="#a855f7">
              <MacroVal>{macros.fat.toFixed(1)}g</MacroVal>
              <MacroLabel>gordura</MacroLabel>
            </MacroCard>
          </MacroRow>

          {/* Meals */}
          <MealList>
            {selectedDayData.meals.map((meal) => (
              <MealCard key={meal.id}>
                <MealHeader>
                  <MealName>{meal.name}</MealName>
                  <MealKcal>{Math.round(meal.kcal)} kcal</MealKcal>
                </MealHeader>
                <ItemList>
                  {meal.items.map((item, i) => (
                    <ItemRow key={i}>
                      <ItemName>{item.foodName}</ItemName>
                      <ItemGrams>{item.grams}g</ItemGrams>
                      <ItemKcal>{Math.round(item.kcal)} kcal</ItemKcal>
                    </ItemRow>
                  ))}
                </ItemList>
              </MealCard>
            ))}
          </MealList>
        </>
      )}
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

const Page = styled.div`padding: 40px 32px; max-width: 700px; animation: ${fadeIn} 0.25s ease;`;

const PageHeader = styled.div`
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px; gap: 16px;
`;
const PageTitle = styled.h1`font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#e8e8f0;`;
const PageSubtitle = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#666677;margin-top:4px;`;

const PdfBtn = styled.button`
  background:transparent;border:1px solid #2a2a35;color:#666677;border-radius:6px;
  padding:7px 14px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;
  transition:all 0.15s;flex-shrink:0;
  &:hover:not(:disabled){border-color:#c8f542;color:#c8f542;}
  &:disabled{opacity:0.4;cursor:not-allowed;}
`;

const DayPicker = styled.div`display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;`;
const DayTab = styled.button<{ $active: boolean }>`
  background:${({ $active }) => $active ? 'rgba(200,245,66,0.12)' : 'transparent'};
  border:1px solid ${({ $active }) => $active ? '#c8f542' : '#2a2a35'};
  color:${({ $active }) => $active ? '#c8f542' : '#666677'};
  border-radius:5px;padding:6px 14px;font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;
  transition:all 0.15s;&:hover{border-color:#c8f542;color:#c8f542;}
`;

const MacroRow = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;`;
const MacroCard = styled.div<{ $color: string }>`
  background:#111118;border:1px solid #1e1e28;border-top:2px solid ${({ $color }) => $color};
  border-radius:8px;padding:14px;text-align:center;
`;
const MacroVal = styled.div`font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#e8e8f0;`;
const MacroLabel = styled.div`font-family:'DM Mono',monospace;font-size:9px;color:#666677;letter-spacing:1px;margin-top:3px;`;

const MealList = styled.div`display:flex;flex-direction:column;gap:12px;`;
const MealCard = styled.div`background:#111118;border:1px solid #1e1e28;border-radius:10px;overflow:hidden;`;
const MealHeader = styled.div`
  display:flex;align-items:center;justify-content:space-between;padding:12px 16px;
  border-bottom:1px solid #1e1e28;background:#0d0d13;
`;
const MealName = styled.div`font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#e8e8f0;`;
const MealKcal = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#c8f542;`;
const ItemList = styled.div`padding:8px 0;`;
const ItemRow = styled.div`
  display:flex;align-items:center;gap:8px;padding:7px 16px;
  border-bottom:1px solid #1a1a22;&:last-child{border-bottom:none;}
`;
const ItemName = styled.div`flex:1;font-family:'DM Sans',sans-serif;font-size:13px;color:#e8e8f0;`;
const ItemGrams = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#666677;`;
const ItemKcal = styled.div`font-family:'DM Mono',monospace;font-size:11px;color:#888899;min-width:60px;text-align:right;`;

const LoadingText = styled.div`padding:80px 24px;font-family:'DM Mono',monospace;font-size:13px;color:#666677;`;
const Empty = styled.div`
  text-align:center;padding:60px 24px;color:#666677;font-family:'DM Mono',monospace;
  font-size:13px;line-height:1.8;
`;
