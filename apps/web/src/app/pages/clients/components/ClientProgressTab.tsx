import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid,
} from 'recharts';
import { ClientStats } from '@libs/types';
import styled from 'styled-components';

interface Props {
  stats: ClientStats;
}

const LEVEL_ORDER = ['INICIANTE', 'INTERMEDIO', 'AVANCADO'];
const LEVEL_LABEL: Record<string, string> = {
  INICIANTE: 'Iniciante', INTERMEDIO: 'Intermédio', AVANCADO: 'Avançado',
};
const LEVEL_COLOR: Record<string, string> = {
  INICIANTE: '#ff8c5a', INTERMEDIO: '#42a5f5', AVANCADO: '#c8f542',
};

export const ClientProgressTab: React.FC<Props> = ({ stats }) => {
  const levelData = stats.assessmentHistory.map((a, i) => ({
    date: new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    level: LEVEL_ORDER.indexOf(a.level),
    levelLabel: LEVEL_LABEL[a.level],
    color: LEVEL_COLOR[a.level],
    num: i + 1,
  }));

  return (
    <Wrap>
      {/* ── Sumário ── */}
      <StatRow>
        <StatCard>
          <StatVal $color="#c8f542">{stats.attendanceRate}%</StatVal>
          <StatLabel>Taxa de comparência</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color="#42a5f5">{stats.completedSessions}</StatVal>
          <StatLabel>Sessões concluídas</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color="#ff3b3b">{stats.noShowSessions + stats.cancelledSessions}</StatVal>
          <StatLabel>Canceladas / Falta</StatLabel>
        </StatCard>
        <StatCard>
          <StatVal $color={LEVEL_COLOR[stats.currentLevel]}>{LEVEL_LABEL[stats.currentLevel]}</StatVal>
          <StatLabel>Nível atual</StatLabel>
        </StatCard>
      </StatRow>

      {/* ── Sessões por semana ── */}
      <ChartWrap>
        <ChartTitle>Sessões por semana (últimas 12)</ChartTitle>
        {stats.sessionHistory.length === 0 ? (
          <Empty>Sem dados de sessões.</Empty>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.sessionHistory} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fill: '#666677', fontSize: 9, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#444455', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#18181f', border: '1px solid #2a2a35', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: '#666677', fontFamily: 'DM Mono', fontSize: 10 }}
              />
              <Bar dataKey="completed" name="Concluídas" fill="#c8f542" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancel./Falta" fill="#ff3b3b55" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartWrap>

      {/* ── Evolução de nível ── */}
      <ChartWrap>
        <ChartTitle>Evolução de nível</ChartTitle>
        {levelData.length === 0 ? (
          <Empty>Sem avaliações registadas.</Empty>
        ) : (
          <>
            <Timeline>
              {stats.assessmentHistory.map((a, i) => (
                <TimelineItem key={a.id}>
                  <TimelineDot $color={LEVEL_COLOR[a.level]} />
                  <TimelineContent>
                    <TimelineDate>{new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</TimelineDate>
                    <TimelineLevel $color={LEVEL_COLOR[a.level]}>{LEVEL_LABEL[a.level]}</TimelineLevel>
                    {a.flags.length > 0 && (
                      <TimelineFlags>{a.flags.map(f => <FlagTag key={f}>⚠ {f}</FlagTag>)}</TimelineFlags>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </>
        )}
      </ChartWrap>

      {/* ── Plano ativo ── */}
      {stats.activeProgram && (
        <ChartWrap>
          <ChartTitle>Plano ativo</ChartTitle>
          <ProgramName>{stats.activeProgram}</ProgramName>
        </ChartWrap>
      )}
    </Wrap>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Wrap = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const StatRow = styled.div`display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; @media(max-width:600px){ grid-template-columns: repeat(2,1fr); }`;
const StatCard = styled.div`background: #18181f; border: 1px solid #2a2a35; border-radius: 8px; padding: 14px;`;
const StatVal = styled.div<{ $color: string }>`font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: ${({ $color }) => $color};`;
const StatLabel = styled.div`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; margin-top: 3px; letter-spacing: 1px;`;

const ChartWrap = styled.div`background: #111118; border: 1px solid #2a2a35; border-radius: 10px; padding: 18px;`;
const ChartTitle = styled.div`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px;`;
const Empty = styled.div`font-family: 'DM Mono', monospace; font-size: 12px; color: #444455; padding: 20px 0;`;

const Timeline = styled.div`display: flex; flex-direction: column; gap: 0;`;
const TimelineItem = styled.div`display: flex; gap: 14px; padding-bottom: 16px; position: relative; &:not(:last-child)::before { content: ''; position: absolute; left: 5px; top: 14px; width: 2px; height: calc(100% - 14px); background: #2a2a35; }`;
const TimelineDot = styled.div<{ $color: string }>`width: 12px; height: 12px; border-radius: 50%; background: ${({ $color }) => $color}; flex-shrink: 0; margin-top: 2px; z-index: 1;`;
const TimelineContent = styled.div``;
const TimelineDate = styled.div`font-family: 'DM Mono', monospace; font-size: 11px; color: #666677;`;
const TimelineLevel = styled.div<{ $color: string }>`font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: ${({ $color }) => $color}; margin: 2px 0;`;
const TimelineFlags = styled.div`display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;`;
const FlagTag = styled.span`font-family: 'DM Mono', monospace; font-size: 10px; padding: 2px 7px; border-radius: 3px; background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.2); color: #ff8c5a;`;
const ProgramName = styled.div`font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #c8f542;`;
