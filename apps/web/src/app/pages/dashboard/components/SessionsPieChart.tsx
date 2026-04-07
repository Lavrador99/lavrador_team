import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styled from 'styled-components';

interface Props {
  data: { type: string; count: number }[];
  title?: string;
}

const COLORS = ['#c8f542', '#42a5f5', '#ff8c5a', '#a855f7'];
const TYPE_LABELS: Record<string, string> = {
  TRAINING: 'Treino',
  ASSESSMENT: 'Avaliação',
  FOLLOWUP: 'Follow-up',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <TooltipBox>
      <strong style={{ color: d.payload.fill }}>{TYPE_LABELS[d.name] ?? d.name}</strong>
      <div style={{ color: '#e8e8f0', marginTop: 2 }}>{d.value} sessões</div>
    </TooltipBox>
  );
};

export const SessionsPieChart: React.FC<Props> = ({ data, title }) => {
  const labelled = data.map((d) => ({ ...d, name: d.type }));

  return (
    <ChartWrap>
      {title && <ChartTitle>{title}</ChartTitle>}
      {data.length === 0 ? (
        <Empty>Sem dados</Empty>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={labelled}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={44}
              paddingAngle={3}
            >
              {labelled.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => TYPE_LABELS[value] ?? value}
              wrapperStyle={{ fontSize: 10, fontFamily: 'DM Mono', color: '#666677' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartWrap>
  );
};

const ChartWrap = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 10px;
  padding: 20px;
`;

const ChartTitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const TooltipBox = styled.div`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 12px;
`;

const Empty = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #444455;
  text-align: center;
  padding: 40px 0;
`;
