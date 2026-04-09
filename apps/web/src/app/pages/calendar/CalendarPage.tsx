import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { workoutsApi } from '../../utils/api/workouts.api';

interface CalendarEntry {
  id: string;
  date: string;
  workoutName: string | null;
  durationMin: number | null;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function buildGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Week starts Monday: getDay() 0=Sun → shift to Mon=0
  const startDow = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export const CalendarPage: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role;
  const userId = user?.id;
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<CalendarEntry | null>(null);

  useEffect(() => {
    const load = role === 'CLIENT'
      ? workoutsApi.getMyCalendar()
      : workoutsApi.getCalendarByClient(userId ?? '');
    load.then(setEntries).finally(() => setLoading(false));
  }, [role, userId]);

  const byDate = React.useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {};
    for (const e of entries) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [entries]);

  const grid = buildGrid(view.year, view.month);

  const prevMonth = () => setView(({ year, month }) => {
    if (month === 0) return { year: year - 1, month: 11 };
    return { year, month: month - 1 };
  });

  const nextMonth = () => setView(({ year, month }) => {
    if (month === 11) return { year: year + 1, month: 0 };
    return { year, month: month + 1 };
  });

  const totalDays = entries.length > 0
    ? new Set(entries.map((e) => e.date)).size
    : 0;
  const totalMin = entries.reduce((a, e) => a + (e.durationMin ?? 0), 0);

  return (
    <Page>
      <Header>
        <Title>Calendário de Treinos</Title>
        <Stats>
          <StatPill>{totalDays} dias treinados</StatPill>
          <StatPill>{Math.round(totalMin / 60)}h {totalMin % 60}min total</StatPill>
        </Stats>
      </Header>

      {loading ? (
        <Loading>A carregar...</Loading>
      ) : (
        <Content>
          <CalendarCard>
            <MonthNav>
              <NavBtn onClick={prevMonth}>‹</NavBtn>
              <MonthLabel>{MONTH_NAMES[view.month]} {view.year}</MonthLabel>
              <NavBtn onClick={nextMonth}>›</NavBtn>
            </MonthNav>

            <DayHeaders>
              {DAY_NAMES.map((d) => <DayHead key={d}>{d}</DayHead>)}
            </DayHeaders>

            <Grid>
              {grid.map((date, i) => {
                if (!date) return <Cell key={i} $empty />;
                const key = date.toISOString().split('T')[0];
                const dayEntries = byDate[key] ?? [];
                const isToday = key === today.toISOString().split('T')[0];
                const hasLog = dayEntries.length > 0;
                return (
                  <Cell
                    key={i}
                    $today={isToday}
                    $active={hasLog}
                    onClick={() => hasLog && setSelected(dayEntries[0])}
                  >
                    <DayNum $today={isToday}>{date.getDate()}</DayNum>
                    {hasLog && <WorkoutDot />}
                  </Cell>
                );
              })}
            </Grid>
          </CalendarCard>

          {selected && (
            <DetailCard>
              <DetailClose onClick={() => setSelected(null)}>✕</DetailClose>
              <DetailDate>{selected.date}</DetailDate>
              <DetailName>{selected.workoutName ?? 'Treino'}</DetailName>
              {selected.durationMin && (
                <DetailMeta>{selected.durationMin} min</DetailMeta>
              )}
            </DetailCard>
          )}

          {entries.length === 0 && (
            <Empty>Ainda não há treinos registados. Completa o teu primeiro treino!</Empty>
          )}
        </Content>
      )}
    </Page>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 32px 24px;
  max-width: 640px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 28px;
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #e8e8f0;
`;

const Stats = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const StatPill = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #c8f542;
  background: rgba(200, 245, 66, 0.08);
  border: 1px solid rgba(200, 245, 66, 0.2);
  border-radius: 20px;
  padding: 4px 12px;
`;

const Loading = styled.div`
  font-family: 'DM Mono', monospace;
  color: #444455;
  padding: 40px;
  text-align: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CalendarCard = styled.div`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 16px;
  padding: 24px;
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const NavBtn = styled.button`
  background: none;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  color: #888899;
  font-size: 20px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;

const MonthLabel = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #e8e8f0;
`;

const DayHeaders = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
`;

const DayHead = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  text-align: center;
  padding: 4px 0;
  letter-spacing: 1px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;

const Cell = styled.div<{ $empty?: boolean; $today?: boolean; $active?: boolean }>`
  aspect-ratio: 1;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: ${({ $active, $empty }) => ($active ? 'pointer' : $empty ? 'default' : 'default')};
  background: ${({ $active, $today }) =>
    $today
      ? 'rgba(200,245,66,0.12)'
      : $active
      ? 'rgba(200,245,66,0.06)'
      : 'transparent'};
  border: 1px solid ${({ $today }) => ($today ? 'rgba(200,245,66,0.4)' : 'transparent')};
  transition: background 0.15s;

  &:hover {
    background: ${({ $active }) => ($active ? 'rgba(200,245,66,0.14)' : 'transparent')};
  }
`;

const DayNum = styled.div<{ $today?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: ${({ $today }) => ($today ? '#c8f542' : '#888899')};
  font-weight: ${({ $today }) => ($today ? '700' : '400')};
`;

const WorkoutDot = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #c8f542;
`;

const DetailCard = styled.div`
  background: #111118;
  border: 1px solid rgba(200, 245, 66, 0.25);
  border-radius: 12px;
  padding: 20px 24px;
  position: relative;
`;

const DetailClose = styled.button`
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: #444455;
  font-size: 14px;
  cursor: pointer;
  &:hover { color: #e8e8f0; }
`;

const DetailDate = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #c8f542;
  margin-bottom: 4px;
`;

const DetailName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #e8e8f0;
`;

const DetailMeta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #888899;
  margin-top: 6px;
`;

const Empty = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #444455;
  text-align: center;
  padding: 24px;
`;
