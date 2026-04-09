import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { sessionsApi } from '../../../utils/api/clients.api';
import { useMyStats } from '../../../hooks/useStats';
import { SessionsBarChart } from './SessionsBarChart';
import { AttendanceGauge } from './AttendanceGauge';
import { SessionDto } from '@libs/types';
import styled from 'styled-components';

const SESSION_TYPE_LABEL: Record<string, string> = {
  TRAINING: 'Treino',
  ASSESSMENT: 'Avaliação',
  FOLLOWUP: 'Acompanhamento',
};

const SESSION_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#42a5f5',
  COMPLETED: '#c8f542',
  CANCELLED: '#ff3b3b',
  NO_SHOW:   '#ff8c5a',
};

const LEVEL_LABEL: Record<string, string> = {
  INICIANTE:  'Iniciante',
  INTERMEDIO: 'Intermédio',
  AVANCADO:   'Avançado',
  iniciante:  'Iniciante',
  intermedio: 'Intermédio',
  avancado:   'Avançado',
};

export const ClientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { stats, loading: loadingStats } = useMyStats();
  const [upcomingSessions, setUpcomingSessions] = useState<SessionDto[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!stats?.clientId) return;
    sessionsApi.getUpcoming(stats.clientId)
      .then(setUpcomingSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [stats?.clientId]);

  const loading = loadingStats || loadingSessions;

  const kpis = [
    {
      label: 'Treinos registados',
      val: stats?.totalWorkoutLogs ?? '—',
      color: '#c8f542',
    },
    {
      label: 'Streak atual',
      val: stats?.workoutStreak != null
        ? `${stats.workoutStreak} ${stats.workoutStreak === 1 ? 'dia' : 'dias'}`
        : '—',
      color: '#f5a442',
    },
    {
      label: 'Taxa de comparência',
      val: stats ? `${stats.attendanceRate}%` : '—',
      color: '#42a5f5',
    },
    {
      label: 'Nível atual',
      val: stats ? (LEVEL_LABEL[stats.currentLevel] ?? stats.currentLevel) : '—',
      color: '#a855f7',
    },
    {
      label: 'Plano ativo',
      val: stats?.activeProgram ?? 'Sem plano',
      color: '#ff8c5a',
      small: true,
    },
  ];

  return (
    <Container>
      {/* ── Quick action ────────────────────────────────────────────────── */}
      <QuickAction onClick={() => navigate('/my-plan')}>
        <QuickActionIcon>▦</QuickActionIcon>
        <QuickActionText>
          <QuickActionTitle>Ver o meu plano de treino</QuickActionTitle>
          <QuickActionSub>Inicia o treino de hoje →</QuickActionSub>
        </QuickActionText>
      </QuickAction>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <KpiGrid>
        {kpis.map(({ label, val, color, small }) => (
          <KpiCard key={label} $color={color}>
            <KpiVal $color={color} $small={!!small}>
              {loadingStats ? '—' : val}
            </KpiVal>
            <KpiLabel>{label}</KpiLabel>
          </KpiCard>
        ))}
      </KpiGrid>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <ChartsRow>
        <ChartMain>
          <SessionsBarChart
            data={stats?.sessionHistory ?? []}
            title="As minhas sessões (últimas 12 semanas)"
          />
        </ChartMain>
        <ChartSide>
          <AttendanceGauge rate={stats?.attendanceRate ?? 0} />
        </ChartSide>
      </ChartsRow>

      {/* ── Treinos recentes ────────────────────────────────────────────── */}
      {stats?.recentWorkoutLogs && stats.recentWorkoutLogs.length > 0 && (
        <>
          <SectionTitle>Treinos recentes</SectionTitle>
          <WorkoutLogList>
            {stats.recentWorkoutLogs.map((log) => (
              <WorkoutLogRow key={log.id}>
                <LogDot />
                <LogInfo>
                  <LogDate>
                    {new Date(log.date).toLocaleDateString('pt-PT', {
                      weekday: 'long', day: '2-digit', month: 'long',
                    })}
                  </LogDate>
                  {log.durationMin && <LogMeta>{log.durationMin} min</LogMeta>}
                </LogInfo>
                <LogRelative>
                  {formatDistanceToNow(new Date(log.date), { addSuffix: true, locale: pt })}
                </LogRelative>
              </WorkoutLogRow>
            ))}
          </WorkoutLogList>
        </>
      )}

      {/* ── Próximas sessões ────────────────────────────────────────────── */}
      <SectionTitle>Próximas sessões</SectionTitle>
      {loading ? (
        <EmptyMsg>A carregar...</EmptyMsg>
      ) : upcomingSessions.length === 0 ? (
        <EmptyMsg>Sem sessões agendadas.</EmptyMsg>
      ) : (
        <SessionList>
          {upcomingSessions.slice(0, 5).map((s) => (
            <SessionRow key={s.id}>
              <SessionDot $color={SESSION_STATUS_COLOR[s.status] ?? '#444'} />
              <SessionInfo>
                <SessionType>{SESSION_TYPE_LABEL[s.type] ?? s.type}</SessionType>
                <SessionDate>
                  {new Date(s.scheduledAt).toLocaleDateString('pt-PT', {
                    weekday: 'long', day: '2-digit', month: 'long',
                  })}
                  {' · '}
                  {new Date(s.scheduledAt).toLocaleTimeString('pt-PT', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                  {' · '}
                  {s.duration} min
                </SessionDate>
                {s.notes && <SessionNotes>{s.notes}</SessionNotes>}
              </SessionInfo>
              <SessionRelative>
                {formatDistanceToNow(new Date(s.scheduledAt), {
                  addSuffix: true, locale: pt,
                })}
              </SessionRelative>
            </SessionRow>
          ))}
        </SessionList>
      )}

      {/* ── Histórico de avaliações ─────────────────────────────────────── */}
      {stats?.assessmentHistory && stats.assessmentHistory.length > 0 && (
        <>
          <SectionTitle>Histórico de avaliações</SectionTitle>
          <AssessmentList>
            {stats.assessmentHistory.map((a) => (
              <AssessmentRow key={a.id}>
                <AssessmentLevel>{LEVEL_LABEL[a.level] ?? a.level}</AssessmentLevel>
                <AssessmentDate>
                  {new Date(a.date).toLocaleDateString('pt-PT', {
                    day: '2-digit', month: 'long', year: 'numeric',
                  })}
                </AssessmentDate>
                {a.flags.length > 0 && (
                  <FlagList>
                    {a.flags.map((f) => <Flag key={f}>{f}</Flag>)}
                  </FlagList>
                )}
              </AssessmentRow>
            ))}
          </AssessmentList>
        </>
      )}
    </Container>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const Container = styled.div``;

const QuickAction = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(200, 245, 66, 0.06);
  border: 1px solid rgba(200, 245, 66, 0.2);
  border-radius: 12px;
  padding: 18px 20px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;
  &:hover {
    background: rgba(200, 245, 66, 0.1);
    border-color: rgba(200, 245, 66, 0.4);
  }
`;

const QuickActionIcon = styled.div`
  font-size: 24px;
  color: #c8f542;
  flex-shrink: 0;
`;

const QuickActionText = styled.div`flex: 1;`;

const QuickActionTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e8e8f0;
`;

const QuickActionSub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #c8f542;
  margin-top: 3px;
  letter-spacing: 0.5px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
  @media (max-width: 700px) { grid-template-columns: repeat(2, 1fr); }
`;

const KpiCard = styled.div<{ $color: string }>`
  background: #111118;
  border: 1px solid #1e1e28;
  border-top: 2px solid ${({ $color }) => $color};
  border-radius: 10px;
  padding: 18px 20px;
`;

const KpiVal = styled.div<{ $color: string; $small: boolean }>`
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  color: ${({ $color }) => $color};
  font-size: ${({ $small }) => $small ? '16px' : '30px'};
  line-height: 1.2;
  word-break: break-word;
`;

const KpiLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 1px;
  margin-top: 6px;
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  margin-bottom: 24px;
  align-items: start;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;

const ChartMain = styled.div`min-width: 0;`;
const ChartSide = styled.div`width: 190px; @media (max-width: 800px) { width: 100%; }`;

const SectionTitle = styled.h2`
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #e8e8f0;
  margin: 0 0 12px;
`;

const EmptyMsg = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #444455;
  padding: 16px 0;
`;

const WorkoutLogList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
`;

const WorkoutLogRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 6px;
  padding: 10px 14px;
`;

const LogDot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c8f542;
  flex-shrink: 0;
`;

const LogInfo = styled.div`flex: 1;`;

const LogDate = styled.div`
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #e8e8f0;
  text-transform: capitalize;
`;

const LogMeta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  margin-top: 2px;
`;

const LogRelative = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  flex-shrink: 0;
`;

const SessionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
`;

const SessionRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 8px;
  padding: 14px 16px;
`;

const SessionDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  margin-top: 5px;
  flex-shrink: 0;
`;

const SessionInfo = styled.div`flex: 1;`;

const SessionType = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 3px;
`;

const SessionDate = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  text-transform: capitalize;
`;

const SessionNotes = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #444455;
  margin-top: 4px;
`;

const SessionRelative = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #42a5f5;
  flex-shrink: 0;
  text-align: right;
`;

const AssessmentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 24px;
`;

const AssessmentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 6px;
  padding: 10px 14px;
  flex-wrap: wrap;
`;

const AssessmentLevel = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #a855f7;
  min-width: 90px;
`;

const AssessmentDate = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  flex: 1;
`;

const FlagList = styled.div`display: flex; gap: 6px; flex-wrap: wrap;`;

const Flag = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 3px;
  background: rgba(255, 107, 53, 0.08);
  color: #ff8c5a;
  border: 1px solid rgba(255, 107, 53, 0.2);
`;
