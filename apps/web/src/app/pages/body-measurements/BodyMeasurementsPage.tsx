import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { AssessmentDto } from '@libs/types';
import { assessmentsApi } from '../../utils/api/prescription.api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataPoint {
  date: string;
  peso?: number;
  bmi?: number;
  pctGordura?: number;
  cc?: number;
  fcRep?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcBMI(peso?: number, altura?: number): number | undefined {
  if (!peso || !altura) return undefined;
  const hm = altura / 100;
  return Math.round((peso / (hm * hm)) * 10) / 10;
}

function bmiCategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Baixo peso', color: '#42a5f5' };
  if (bmi < 25)   return { label: 'Normal',     color: '#c8f542' };
  if (bmi < 30)   return { label: 'Excesso',    color: '#f5a442' };
  return               { label: 'Obesidade',    color: '#ff6b6b' };
}

const METRICS: { key: keyof DataPoint; label: string; unit: string; color: string; refMin?: number; refMax?: number }[] = [
  { key: 'peso',       label: 'Peso',          unit: 'kg',  color: '#c8f542' },
  { key: 'bmi',        label: 'IMC',           unit: '',    color: '#42a5f5', refMin: 18.5, refMax: 25 },
  { key: 'pctGordura', label: '% Gordura',     unit: '%',   color: '#f5a442' },
  { key: 'cc',         label: 'Cintura',       unit: 'cm',  color: '#c084fc' },
  { key: 'fcRep',      label: 'FC Repouso',    unit: 'bpm', color: '#f472b6' },
];

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <TooltipBox>
      <TooltipDate>{label}</TooltipDate>
      <TooltipVal>{payload[0].value}{unit}</TooltipVal>
    </TooltipBox>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const BodyMeasurementsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<AssessmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<keyof DataPoint>('peso');

  useEffect(() => {
    assessmentsApi.getMy()
      .then(setAssessments)
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo<DataPoint[]>(() =>
    assessments
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((a) => ({
        date: new Date(a.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: '2-digit' }),
        peso:       a.data.peso,
        bmi:        calcBMI(a.data.peso, a.data.altura),
        pctGordura: a.data.pctGordura,
        cc:         a.data.cc,
        fcRep:      a.data.fcRep,
      })),
  [assessments]);

  const latest = chartData[chartData.length - 1];
  const first  = chartData[0];

  const delta = (key: keyof DataPoint) => {
    const l = latest?.[key] as number | undefined;
    const f = first?.[key]  as number | undefined;
    if (l == null || f == null || l === f) return null;
    const d = Math.round((l - f) * 10) / 10;
    return d;
  };

  const current = METRICS.map((m) => ({
    ...m,
    value: latest?.[m.key] as number | undefined,
    diff: delta(m.key),
  }));

  const activeConfig = METRICS.find((m) => m.key === activeMetric)!;

  return (
    <Page>
      <Header>
        <Title>Medições Corporais</Title>
        <Sub>Evolução ao longo das avaliações</Sub>
      </Header>

      {loading ? (
        <Loading>A carregar dados...</Loading>
      ) : assessments.length === 0 ? (
        <Empty>
          Ainda não tens avaliações registadas.<br />
          Fala com o teu treinador para agendar a primeira avaliação.
        </Empty>
      ) : (
        <>
          {/* ── Current values ── */}
          <CardsGrid>
            {current.map((m) => (
              <MetricCard
                key={m.key}
                $active={activeMetric === m.key}
                $color={m.color}
                onClick={() => setActiveMetric(m.key)}
              >
                <MetricTop>
                  <MetricLabel>{m.label}</MetricLabel>
                  {m.diff !== null && (
                    <DeltaBadge $positive={m.diff < 0 && m.key !== 'peso' ? false : m.diff > 0}>
                      {m.diff > 0 ? '+' : ''}{m.diff}{m.unit}
                    </DeltaBadge>
                  )}
                </MetricTop>
                <MetricValue $color={m.color}>
                  {m.value != null ? `${m.value}` : '—'}
                  {m.value != null && <MetricUnit>{m.unit}</MetricUnit>}
                </MetricValue>
                {m.key === 'bmi' && m.value != null && (
                  <BmiLabel $color={bmiCategory(m.value).color}>
                    {bmiCategory(m.value).label}
                  </BmiLabel>
                )}
              </MetricCard>
            ))}
          </CardsGrid>

          {/* ── Chart ── */}
          {chartData.length > 1 ? (
            <ChartSection>
              <ChartTitle>
                {activeConfig.label}
                {activeConfig.unit && ` (${activeConfig.unit})`}
              </ChartTitle>
              <ChartCard>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
                    <XAxis dataKey="date" tick={{ fill: '#444455', fontSize: 10 }} />
                    <YAxis
                      tick={{ fill: '#444455', fontSize: 10 }}
                      unit={activeConfig.unit ? ` ${activeConfig.unit}` : ''}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip unit={activeConfig.unit} />} />
                    {activeConfig.refMin != null && (
                      <ReferenceLine y={activeConfig.refMin} stroke="#2a2a35" strokeDasharray="4 2" label={{ value: String(activeConfig.refMin), fill: '#444455', fontSize: 9 }} />
                    )}
                    {activeConfig.refMax != null && (
                      <ReferenceLine y={activeConfig.refMax} stroke="#2a2a35" strokeDasharray="4 2" label={{ value: String(activeConfig.refMax), fill: '#444455', fontSize: 9 }} />
                    )}
                    <Line
                      type="monotone"
                      dataKey={activeMetric}
                      stroke={activeConfig.color}
                      strokeWidth={2.5}
                      dot={{ fill: activeConfig.color, r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </ChartSection>
          ) : (
            <OnlyOneNote>
              Com mais avaliações, vais ver a tua evolução aqui. Continua! 💪
            </OnlyOneNote>
          )}

          {/* ── History table ── */}
          <HistSection>
            <ChartTitle>Histórico de avaliações</ChartTitle>
            <HistTable>
              <thead>
                <tr>
                  <Th>Data</Th>
                  <Th center>Peso</Th>
                  <Th center>IMC</Th>
                  <Th center>% Gord.</Th>
                  <Th center>Cintura</Th>
                  <Th center>FC rep.</Th>
                </tr>
              </thead>
              <tbody>
                {chartData.slice().reverse().map((row, i) => (
                  <tr key={i}>
                    <Td>{row.date}</Td>
                    <Td center>{row.peso ?? '—'} {row.peso ? 'kg' : ''}</Td>
                    <Td center $highlight={row.bmi != null && row.bmi >= 18.5 && row.bmi < 25}>
                      {row.bmi ?? '—'}
                    </Td>
                    <Td center>{row.pctGordura != null ? `${row.pctGordura}%` : '—'}</Td>
                    <Td center>{row.cc != null ? `${row.cc} cm` : '—'}</Td>
                    <Td center>{row.fcRep != null ? `${row.fcRep} bpm` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </HistTable>
          </HistSection>
        </>
      )}
    </Page>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const Page = styled.div`
  padding: 32px 24px;
  max-width: 760px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 28px;
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;

const Sub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #444455;
  margin-top: 4px;
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
  text-align: center;
  padding: 60px 20px;
  line-height: 2;
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  margin-bottom: 28px;
`;

const MetricCard = styled.div<{ $active: boolean; $color: string }>`
  background: ${({ $active, $color }) => ($active ? `${$color}11` : '#111118')};
  border: 1px solid ${({ $active, $color }) => ($active ? `${$color}55` : '#1a1a22')};
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: ${({ $color }) => `${$color}44`}; }
`;

const MetricTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const MetricLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #444455;
  text-transform: uppercase;
`;

const DeltaBadge = styled.div<{ $positive: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: ${({ $positive }) => ($positive ? '#c8f542' : '#ff6b6b')};
  background: ${({ $positive }) => ($positive ? 'rgba(200,245,66,0.08)' : 'rgba(255,107,107,0.08)')};
  border-radius: 4px;
  padding: 1px 5px;
`;

const MetricValue = styled.div<{ $color: string }>`
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const MetricUnit = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  font-weight: 400;
  color: #888899;
  margin-left: 3px;
`;

const BmiLabel = styled.div<{ $color: string }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: ${({ $color }) => $color};
  margin-top: 4px;
`;

const ChartSection = styled.div`
  margin-bottom: 28px;
`;

const ChartTitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 2px;
  color: #666677;
  text-transform: uppercase;
  margin-bottom: 12px;
`;

const ChartCard = styled.div`
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 14px;
  padding: 20px 12px 12px;
`;

const OnlyOneNote = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #444455;
  text-align: center;
  padding: 24px;
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 12px;
  margin-bottom: 28px;
`;

const TooltipBox = styled.div`
  background: #1a1a22;
  border: 1px solid #2a2a35;
  border-radius: 8px;
  padding: 8px 12px;
  font-family: 'DM Mono', monospace;
`;

const TooltipDate = styled.div`
  font-size: 10px;
  color: #666677;
  margin-bottom: 2px;
`;

const TooltipVal = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #e8e8f0;
`;

const HistSection = styled.div``;

const HistTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  background: #111118;
  border: 1px solid #1a1a22;
  border-radius: 12px;
  overflow: hidden;
`;

const Th = styled.th<{ center?: boolean }>`
  text-align: ${({ center }) => (center ? 'center' : 'left')};
  color: #444455;
  padding: 10px 14px;
  border-bottom: 1px solid #1a1a22;
  font-weight: 400;
  letter-spacing: 1px;
  font-size: 10px;
  background: #0d0d13;
`;

const Td = styled.td<{ center?: boolean; $highlight?: boolean }>`
  padding: 10px 14px;
  color: ${({ $highlight }) => ($highlight ? '#c8f542' : '#888899')};
  border-bottom: 1px solid #111118;
  text-align: ${({ center }) => (center ? 'center' : 'left')};
  &:first-child { color: #e8e8f0; }
`;
