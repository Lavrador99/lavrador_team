import React from 'react';
import styled from 'styled-components';

interface Props {
  rate: number; // 0–100
  label?: string;
}

export const AttendanceGauge: React.FC<Props> = ({ rate, label = 'Taxa de comparência' }) => {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (rate / 100) * circumference;

  const color = rate >= 80 ? '#c8f542' : rate >= 60 ? '#ff8c5a' : '#ff3b3b';

  return (
    <Wrap>
      <ChartTitle>{label}</ChartTitle>
      <GaugeWrap>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle
            cx="70" cy="70" r={r}
            fill="none" stroke="#2a2a35" strokeWidth="10"
          />
          <circle
            cx="70" cy="70" r={r}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
          <text x="70" y="65" textAnchor="middle" fill={color} fontSize="28" fontFamily="Syne, sans-serif" fontWeight="800">
            {rate}%
          </text>
          <text x="70" y="82" textAnchor="middle" fill="#666677" fontSize="10" fontFamily="DM Mono, monospace">
            este mês
          </text>
        </svg>
      </GaugeWrap>
      <GaugeHint $color={color}>
        {rate >= 80 ? '✓ Excelente' : rate >= 60 ? '~ Razoável' : '↓ A melhorar'}
      </GaugeHint>
    </Wrap>
  );
};

const Wrap = styled.div`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ChartTitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 16px;
  align-self: flex-start;
`;

const GaugeWrap = styled.div`
  margin: 4px 0;
`;

const GaugeHint = styled.div<{ $color: string }>`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: ${({ $color }) => $color};
  margin-top: 8px;
`;
