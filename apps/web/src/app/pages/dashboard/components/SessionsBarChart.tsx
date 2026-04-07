import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import styled from 'styled-components';

interface Props {
  data: { week: string; completed: number; cancelled: number; noShow?: number }[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <TooltipLabel>{label}</TooltipLabel>
      {payload.map((p: any) => (
        <TooltipRow key={p.dataKey}>
          <TooltipDot $color={p.color} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </TooltipRow>
      ))}
    </TooltipBox>
  );
};

export const SessionsBarChart: React.FC<Props> = ({ data, title }) => (
  <ChartWrap>
    {title && <ChartTitle>{title}</ChartTitle>}
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="week"
          tick={{ fill: '#666677', fontSize: 10, fontFamily: 'DM Mono' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#444455', fontSize: 10, fontFamily: 'DM Mono' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(200,245,66,0.04)' }} />
        <Legend
          wrapperStyle={{ fontSize: 10, fontFamily: 'DM Mono', color: '#666677', paddingTop: 8 }}
        />
        <Bar dataKey="completed" name="Concluídas" fill="#c8f542" radius={[3, 3, 0, 0]} />
        <Bar dataKey="cancelled" name="Canceladas / Falta" fill="#ff3b3b44" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </ChartWrap>
);

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
  color: #e8e8f0;
`;

const TooltipLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  margin-bottom: 6px;
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
  font-size: 12px;
`;

const TooltipDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;
