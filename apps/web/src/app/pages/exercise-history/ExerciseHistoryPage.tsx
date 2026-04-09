import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { workoutsApi } from '../../utils/api/workouts.api';

interface HistoryEntry {
  date: string;
  sets: { setNumber: number; reps: number; load?: number; rpe?: number; completed: boolean }[];
}

interface ChartPoint {
  date: string;
  maxLoad: number | null;
  avgLoad: number | null;
  totalReps: number;
  estimated1RM: number | null;
  volume: number; // load × reps (sum of completed sets)
}

function epley(load: number, reps: number) {
  if (reps < 2 || load <= 0) return null;
  return Math.round(load * (1 + reps / 30));
}

function buildChartData(entries: HistoryEntry[]): ChartPoint[] {
  return entries.map((e) => {
    const completed = e.sets.filter((s) => s.completed && s.reps > 0);
    const loads = completed.map((s) => s.load ?? 0).filter(Boolean);
    const maxLoad = loads.length ? Math.max(...loads) : null;
    const avgLoad = loads.length ? Math.round(loads.reduce((a, b) => a + b, 0) / loads.length) : null;
    const totalReps = completed.reduce((a, s) => a + s.reps, 0);
    const best = completed.reduce<{ load: number; reps: number } | null>((best, s) => {
      const rm = s.load ? epley(s.load, s.reps) ?? 0 : 0;
      const prevRm = best ? epley(best.load, best.reps) ?? 0 : 0;
      return rm > prevRm ? { load: s.load ?? 0, reps: s.reps } : best;
    }, null);
    const estimated1RM = best ? epley(best.load, best.reps) : null;
    const volume = completed.reduce((a, s) => a + (s.load ?? 0) * s.reps, 0);

    return {
      date: e.date.split('T')[0],
      maxLoad,
      avgLoad,
      totalReps,
      estimated1RM,
      volume: Math.round(volume),
    };
  });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <TooltipDate>{label}</TooltipDate>
      {payload.map((p: any) => (
        <TooltipRow key={p.dataKey}>
          <TooltipDot style={{ background: p.color }} />
          <span style={{ color: '#888899' }}>{p.name}:</span>
          <strong style={{ color: '#e8e8f0' }}> {p.value}{p.unit ?? ''}</strong>
        </TooltipRow>
      ))}
    </TooltipBox>
  );
};

export const ExerciseHistoryPage: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'1rm' | 'volume' | 'reps'>('1rm');

  useEffect(() => {
    if (!exerciseId) return;
    workoutsApi.getMyExerciseHistory(exerciseId)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [exerciseId]);

  const chartData = buildChartData(history);
  const exerciseName = decodeURIComponent(exerciseId ?? '');
  const latest = chartData[chartData.length - 1];
  const first = chartData[0];
  const rmImprovement = latest?.estimated1RM && first?.estimated1RM
    ? latest.estimated1RM - first.estimated1RM
    : null;

  return (
    <Page>
      <BackBtn onClick={() => navigate(-1)}>← voltar</BackBtn>
      <Title>{exerciseName}</Title>

      {loading ? (
        <Loading>A carregar histórico...</Loading>
      ) : history.length === 0 ? (
        <Empty>Sem registos para este exercício ainda.</Empty>
      ) : (
        <>
          <SummaryRow>
            {latest?.estimated1RM && (
              <SummaryCard>
                <SummaryVal>{latest.estimated1RM} kg</SummaryVal>
                <SummaryLabel>1RM estimado</SummaryLabel>
                {rmImprovement !== null && rmImprovement > 0 && (
                  <SummaryDelta>+{rmImprovement} kg desde o início</SummaryDelta>
                )}
              </SummaryCard>
            )}
            {latest?.maxLoad && (
              <SummaryCard>
                <SummaryVal>{latest.maxLoad} kg</SummaryVal>
                <SummaryLabel>Carga máx. último</SummaryLabel>
              </SummaryCard>
            )}
            <SummaryCard>
              <SummaryVal>{history.length}</SummaryVal>
              <SummaryLabel>sessões registadas</SummaryLabel>
            </SummaryCard>
          </SummaryRow>

          <TabRow>
            <Tab $active={tab === '1rm'} onClick={() => setTab('1rm')}>1RM Estimado</Tab>
            <Tab $active={tab === 'volume'} onClick={() => setTab('volume')}>Volume</Tab>
            <Tab $active={tab === 'reps'} onClick={() => setTab('reps')}>Repetições</Tab>
          </TabRow>

          <ChartCard>
            {tab === '1rm' && (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
                  <XAxis dataKey="date" tick={{ fill: '#444455', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#444455', fontSize: 10 }} unit=" kg" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#666677' }} />
                  <Line
                    type="monotone"
                    dataKey="estimated1RM"
                    name="1RM (Epley)"
                    stroke="#c8f542"
                    strokeWidth={2}
                    dot={{ fill: '#c8f542', r: 3 }}
                    connectNulls
                    unit=" kg"
                  />
                  <Line
                    type="monotone"
                    dataKey="maxLoad"
                    name="Carga máx."
                    stroke="#42a5f5"
                    strokeWidth={1.5}
                    dot={{ fill: '#42a5f5', r: 2 }}
                    connectNulls
                    unit=" kg"
                    strokeDasharray="4 2"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {tab === 'volume' && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
                  <XAxis dataKey="date" tick={{ fill: '#444455', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#444455', fontSize: 10 }} unit=" kg" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="volume" name="Volume total" fill="#c8f542" radius={[4, 4, 0, 0]} unit=" kg" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {tab === 'reps' && (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
                  <XAxis dataKey="date" tick={{ fill: '#444455', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#444455', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="totalReps" name="Reps totais" fill="#42a5f5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <HistoryTable>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Séries</Th>
                <Th>Carga máx.</Th>
                <Th>1RM est.</Th>
                <Th>Volume</Th>
              </tr>
            </thead>
            <tbody>
              {[...chartData].reverse().map((row, i) => (
                <tr key={i}>
                  <Td>{row.date}</Td>
                  <Td>{history[history.length - 1 - i]?.sets.filter((s) => s.completed).length ?? 0}</Td>
                  <Td>{row.maxLoad ? `${row.maxLoad} kg` : '—'}</Td>
                  <Td $highlight={!!row.estimated1RM}>{row.estimated1RM ? `~${row.estimated1RM} kg` : '—'}</Td>
                  <Td>{row.volume ? `${row.volume} kg` : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </HistoryTable>
        </>
      )}
    </Page>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 24px 20px;
  max-width: 720px;
  margin: 0 auto;
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  margin-bottom: 12px;
  padding: 0;
  &:hover { color: #e8e8f0; }
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #e8e8f0;
  margin-bottom: 24px;
`;

const Loading = styled.div`
  font-family: 'DM Mono', monospace;
  color: #444455;
  padding: 40px;
  text-align: center;
`;

const Empty = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #444455;
  padding: 40px;
  text-align: center;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 12px;
  padding: 14px 18px;
  flex: 1;
  min-width: 120px;
`;

const SummaryVal = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: #c8f542;
`;

const SummaryLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  letter-spacing: 1px;
  margin-top: 2px;
`;

const SummaryDelta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #42a5f5;
  margin-top: 4px;
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'rgba(200,245,66,0.1)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? 'rgba(200,245,66,0.4)' : '#2a2a35')};
  border-radius: 8px;
  color: ${({ $active }) => ($active ? '#c8f542' : '#666677')};
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.15s;
`;

const ChartCard = styled.div`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 14px;
  padding: 20px 12px 12px;
  margin-bottom: 24px;
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

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
`;

const Th = styled.th`
  text-align: left;
  color: #444455;
  padding: 6px 10px;
  border-bottom: 1px solid #1a1a22;
  font-weight: 400;
  letter-spacing: 1px;
  font-size: 10px;
`;

const Td = styled.td<{ $highlight?: boolean }>`
  padding: 8px 10px;
  color: ${({ $highlight }) => ($highlight ? '#c8f542' : '#888899')};
  border-bottom: 1px solid #111118;
  &:first-child { color: #e8e8f0; }
`;
