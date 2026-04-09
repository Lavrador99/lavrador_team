import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { workoutsApi } from '../../utils/api/workouts.api';
import { MuscleMap } from '../../components/MuscleMap';
import { RootState } from '../../store';

interface VolumeCard {
  muscle: string;
  sets: number;
  pct: number;
}

type WeeklyEntry = { week: string } & Record<string, number | string>;

const MUSCLE_PT: Record<string, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  core: 'Core',
  quadriceps: 'Quadríceps',
  hamstrings: 'Hamstrings',
  gluteos: 'Glúteos',
  gemeos: 'Gémeos',
  outro: 'Outro',
};

const COLORS = [
  '#c8f542', '#42a5f5', '#f5a442', '#c084fc',
  '#f472b6', '#34d399', '#60a5fa', '#fb923c',
];

const WEEKS_OPTIONS = [2, 4, 8, 12];

// Map muscleGroup names to MuscleMap keys
function muscleGroupToMapKey(muscle: string): string {
  const map: Record<string, string> = {
    peito: 'peitoral',
    costas: 'costas',
    ombros: 'deltoides',
    biceps: 'biceps',
    triceps: 'triceps',
    core: 'abdominais',
    quadriceps: 'quadriceps',
    hamstrings: 'hamstrings',
    gluteos: 'gluteos',
    gemeos: 'gemeos',
  };
  return map[muscle] ?? muscle;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <TooltipDate>{label}</TooltipDate>
      {payload.map((p: any) => (
        <TooltipRow key={p.dataKey}>
          <TooltipDot style={{ background: p.fill }} />
          <span style={{ color: '#888899' }}>{MUSCLE_PT[p.dataKey] ?? p.dataKey}:</span>
          <strong style={{ color: '#e8e8f0' }}> {p.value} séries</strong>
        </TooltipRow>
      ))}
    </TooltipBox>
  );
};

export const MuscleVolumePage: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const role = user?.role;
  const userId = user?.id;

  const [weeks, setWeeks] = useState(4);
  const [cards, setCards] = useState<VolumeCard[]>([]);
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const req = role === 'CLIENT'
      ? workoutsApi.getMyMuscleVolume(weeks)
      : workoutsApi.getMuscleVolumeByClient(userId ?? '', weeks);
    req.then((d) => {
      setCards(d.cards);
      setWeekly(d.weekly);
    }).finally(() => setLoading(false));
  }, [role, userId, weeks]);

  // Build heatmap: top 30% → primary, next 40% → secondary
  const maxSets = cards[0]?.sets ?? 1;
  const primaryMuscles = cards
    .filter((c) => c.sets >= maxSets * 0.5)
    .map((c) => muscleGroupToMapKey(c.muscle));
  const secondaryMuscles = cards
    .filter((c) => c.sets >= maxSets * 0.15 && c.sets < maxSets * 0.5)
    .map((c) => muscleGroupToMapKey(c.muscle));

  // Collect all muscle keys for weekly bar chart bars
  const muscleKeys = Array.from(
    new Set(weekly.flatMap((w) => Object.keys(w).filter((k) => k !== 'week')))
  );

  const totalSets = cards.reduce((a, c) => a + c.sets, 0);

  return (
    <Page>
      <Header>
        <Title>Volume Muscular</Title>
        <WeeksSelector>
          {WEEKS_OPTIONS.map((w) => (
            <WeeksBtn key={w} $active={weeks === w} onClick={() => setWeeks(w)}>
              {w}sem
            </WeeksBtn>
          ))}
        </WeeksSelector>
      </Header>

      {loading ? (
        <Loading>A calcular volume...</Loading>
      ) : cards.length === 0 ? (
        <Empty>Ainda não há treinos registados neste período.</Empty>
      ) : (
        <Content>
          {/* ── Heatmap ── */}
          <Section>
            <SectionTitle>Heatmap Muscular</SectionTitle>
            <SectionSub>
              Verde = grupos mais trabalhados · Azul = grupos secundários
            </SectionSub>
            <HeatmapWrap>
              <MuscleMap primaryMuscles={primaryMuscles} secondaryMuscles={secondaryMuscles} />
            </HeatmapWrap>
          </Section>

          {/* ── Volume cards ── */}
          <Section>
            <SectionTitle>Distribuição de Volume</SectionTitle>
            <SectionSub>{totalSets} séries totais nos últimos {weeks} semanas</SectionSub>
            <CardsGrid>
              {cards.slice(0, 8).map((card, i) => (
                <VolumeCardEl key={card.muscle} $intensity={card.pct / 100}>
                  <CardBar style={{ width: `${card.pct}%`, background: COLORS[i % COLORS.length] }} />
                  <CardContent>
                    <CardMuscle>{MUSCLE_PT[card.muscle] ?? card.muscle}</CardMuscle>
                    <CardStats>
                      <CardSets>{card.sets} séries</CardSets>
                      <CardPct style={{ color: COLORS[i % COLORS.length] }}>{card.pct}%</CardPct>
                    </CardStats>
                  </CardContent>
                </VolumeCardEl>
              ))}
            </CardsGrid>
          </Section>

          {/* ── Weekly bar chart ── */}
          {weekly.length > 0 && (
            <Section>
              <SectionTitle>Séries por Semana</SectionTitle>
              <SectionSub>Comparativo semanal por grupo muscular</SectionSub>
              <ChartCard>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={weekly}
                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fill: '#444455', fontSize: 10 }}
                    />
                    <YAxis tick={{ fill: '#444455', fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 10, color: '#666677' }}
                      formatter={(value) => MUSCLE_PT[value] ?? value}
                    />
                    {muscleKeys.map((key, i) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={key}
                        stackId="a"
                        fill={COLORS[i % COLORS.length]}
                        radius={i === muscleKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Section>
          )}

          {/* ── Pie-style donut summary ── */}
          <Section>
            <SectionTitle>Resumo</SectionTitle>
            <DonutRow>
              {cards.slice(0, 6).map((card, i) => (
                <DonutItem key={card.muscle}>
                  <DonutCircle $color={COLORS[i % COLORS.length]} $pct={card.pct}>
                    <DonutInner>
                      <DonutPct>{card.pct}%</DonutPct>
                    </DonutInner>
                  </DonutCircle>
                  <DonutLabel>{MUSCLE_PT[card.muscle] ?? card.muscle}</DonutLabel>
                </DonutItem>
              ))}
            </DonutRow>
          </Section>
        </Content>
      )}
    </Page>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 32px 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;

const WeeksSelector = styled.div`
  display: flex;
  gap: 6px;
`;

const WeeksBtn = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'rgba(200,245,66,0.12)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(200,245,66,0.4)' : '#2a2a35')};
  border-radius: 8px;
  color: ${({ $active }) => ($active ? '#c8f542' : '#666677')};
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s;
`;

const Loading = styled.div`
  font-family: 'DM Mono', monospace;
  color: #444455;
  padding: 60px;
  text-align: center;
`;

const Empty = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #444455;
  padding: 60px;
  text-align: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 36px;
`;

const Section = styled.div``;

const SectionTitle = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 4px;
`;

const SectionSub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444455;
  margin-bottom: 16px;
`;

const HeatmapWrap = styled.div`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: center;
`;

const CardsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VolumeCardEl = styled.div<{ $intensity: number }>`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
`;

const CardBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  transition: width 0.5s ease;
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
`;

const CardMuscle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #e8e8f0;
`;

const CardStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CardSets = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #666677;
`;

const CardPct = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 14px;
  font-weight: 700;
  min-width: 36px;
  text-align: right;
`;

const ChartCard = styled.div`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 14px;
  padding: 20px 12px 12px;
`;

const TooltipBox = styled.div`
  background: #1a1a22;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 10px 14px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
`;

const TooltipDate = styled.div`
  color: #c8f542;
  font-size: 10px;
  margin-bottom: 6px;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`;

const TooltipDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const DonutRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
`;

const DonutItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const DonutCircle = styled.div<{ $color: string; $pct: number }>`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: conic-gradient(
    ${({ $color }) => $color} ${({ $pct }) => $pct * 3.6}deg,
    #1e1e28 ${({ $pct }) => $pct * 3.6}deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DonutInner = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #0a0a0f;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DonutPct = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #e8e8f0;
`;

const DonutLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  text-align: center;
`;
