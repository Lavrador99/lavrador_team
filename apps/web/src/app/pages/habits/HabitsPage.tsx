import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { habitsApi, HabitDto, HabitAdherence } from '../../utils/api/habits.api';

const todayStr = () => new Date().toISOString().split('T')[0];

const isLoggedToday = (habit: HabitDto): boolean => {
  const t = todayStr();
  return habit.logs.some((l) => l.date.split('T')[0] === t && l.completed);
};

// Last 7 days labels
const last7Days = (): string[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
};

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<HabitDto[]>([]);
  const [adherence, setAdherence] = useState<HabitAdherence | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    Promise.all([
      habitsApi.getMy(),
      habitsApi.getMyAdherence(),
    ])
      .then(([h, a]) => { setHabits(h); setAdherence(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (habit: HabitDto) => {
    const alreadyDone = isLoggedToday(habit);
    setTogglingId(habit.id);
    try {
      await habitsApi.log(habit.id, todayStr(), !alreadyDone);
      load();
    } finally {
      setTogglingId(null);
    }
  };

  const days = last7Days();

  if (loading) {
    return (
      <Page>
        <LoadingText>A carregar hábitos...</LoadingText>
      </Page>
    );
  }

  if (habits.length === 0) {
    return (
      <Page>
        <PageHeader>
          <PageTitle>Os meus hábitos</PageTitle>
          <PageSubtitle>// Rotinas diárias</PageSubtitle>
        </PageHeader>
        <Empty>
          Ainda não tens hábitos definidos.<br />
          Fala com o teu treinador para começar!
        </Empty>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Os meus hábitos</PageTitle>
          <PageSubtitle>// {habits.length} hábito{habits.length !== 1 ? 's' : ''} · hoje</PageSubtitle>
        </div>
        {adherence && (
          <AdherenceBadge $pct={adherence.adherencePct}>
            {adherence.adherencePct}%<br />
            <AdherenceSub>adesão 7d</AdherenceSub>
          </AdherenceBadge>
        )}
      </PageHeader>

      {/* Today's checklist */}
      <SectionLabel>HOJE</SectionLabel>
      <HabitList>
        {habits.map((habit) => {
          const done = isLoggedToday(habit);
          const toggling = togglingId === habit.id;
          return (
            <HabitRow key={habit.id} $done={done}>
              <HabitIcon>{habit.icon ?? '●'}</HabitIcon>
              <HabitName $done={done}>{habit.name}</HabitName>
              <CheckBtn $done={done} disabled={toggling} onClick={() => handleToggle(habit)}>
                {done ? '✓' : '○'}
              </CheckBtn>
            </HabitRow>
          );
        })}
      </HabitList>

      {/* 7-day heatmap */}
      <SectionLabel style={{ marginTop: 28 }}>ÚLTIMOS 7 DIAS</SectionLabel>
      <HeatmapTable>
        <HeatmapHeader>
          <HeatmapCol style={{ width: 160 }} />
          {days.map((d) => (
            <HeatmapCol key={d}>
              <DayLabel>
                {new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'short' })}
              </DayLabel>
            </HeatmapCol>
          ))}
        </HeatmapHeader>
        {habits.map((habit) => (
          <HeatmapRow key={habit.id}>
            <HeatmapName>{habit.icon} {habit.name}</HeatmapName>
            {days.map((d) => {
              const log = habit.logs.find((l) => l.date.split('T')[0] === d);
              const done = log?.completed ?? false;
              return <HeatCell key={d} $done={done} title={d} />;
            })}
          </HeatmapRow>
        ))}
      </HeatmapTable>
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

const Page = styled.div`
  padding: 40px 32px;
  max-width: 700px;
  animation: ${fadeIn} 0.25s ease;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
`;

const PageTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;

const PageSubtitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  margin-top: 4px;
`;

const AdherenceBadge = styled.div<{ $pct: number }>`
  background: rgba(200,245,66,0.08);
  border: 1px solid rgba(200,245,66,0.25);
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #c8f542;
  flex-shrink: 0;
`;

const AdherenceSub = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #666677;
  letter-spacing: 1px;
`;

const SectionLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: #444455;
  margin-bottom: 12px;
`;

const HabitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HabitRow = styled.div<{ $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  background: #111118;
  border: 1px solid ${({ $done }) => ($done ? 'rgba(200,245,66,0.2)' : '#1e1e28')};
  border-radius: 10px;
  padding: 14px 16px;
  transition: all 0.2s;
  opacity: ${({ $done }) => ($done ? 0.7 : 1)};
`;

const HabitIcon = styled.span`font-size: 20px; flex-shrink: 0;`;

const HabitName = styled.div<{ $done: boolean }>`
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: ${({ $done }) => ($done ? '#666677' : '#e8e8f0')};
  text-decoration: ${({ $done }) => ($done ? 'line-through' : 'none')};
  flex: 1;
  transition: all 0.2s;
`;

const CheckBtn = styled.button<{ $done: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid ${({ $done }) => ($done ? '#c8f542' : '#2a2a35')};
  background: ${({ $done }) => ($done ? 'rgba(200,245,66,0.15)' : 'transparent')};
  color: ${({ $done }) => ($done ? '#c8f542' : '#444455')};
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover:not(:disabled) { border-color: #c8f542; color: #c8f542; }
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const HeatmapTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const HeatmapHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HeatmapCol = styled.div`
  flex: 1;
  text-align: center;
`;

const DayLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #444455;
  letter-spacing: 1px;
  text-transform: uppercase;
`;

const HeatmapRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const HeatmapName = styled.div`
  width: 160px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #888899;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;

const HeatCell = styled.div<{ $done: boolean }>`
  flex: 1;
  height: 28px;
  border-radius: 4px;
  background: ${({ $done }) => ($done ? 'rgba(200,245,66,0.45)' : '#1a1a22')};
  border: 1px solid ${({ $done }) => ($done ? 'rgba(200,245,66,0.3)' : 'transparent')};
  transition: background 0.2s;
`;

const LoadingText = styled.div`
  padding: 80px 24px;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #666677;
`;

const Empty = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  line-height: 1.8;
`;
