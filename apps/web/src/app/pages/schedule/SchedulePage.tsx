import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchSessions, setViewMode, setCurrentDate, selectSession } from '../../store/slices/scheduleSlice';
import { clientsApi } from '../../utils/api/clients.api';
import { SessionDto } from '@libs/types';
import { SessionModal } from './components/SessionModal';
import styled from 'styled-components';

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#42a5f5', COMPLETED: '#c8f542',
  CANCELLED: '#ff3b3b', NO_SHOW: '#ff8c5a',
};
const TYPE_LABEL: Record<string, string> = {
  TRAINING: 'Treino', ASSESSMENT: 'Avaliação', FOLLOWUP: 'Follow-up',
};

export const SchedulePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const { sessions, loading, viewMode, currentDate, selectedSession } = useSelector(
    (s: RootState) => s.schedule,
  );
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>();
  const [editSession, setEditSession] = useState<SessionDto | null>(null);

  const current = new Date(currentDate);

  // Carregar clientes para o modal
  useEffect(() => {
    clientsApi.getAll().then((data) =>
      setClients(data.map((c) => ({ id: c.client?.id ?? c.id, name: c.client?.name ?? c.email }))),
    );
  }, []);

  // Fetch sessions para o intervalo visível
  const loadSessions = useCallback(() => {
    const { from, to } = getDateRange(current, viewMode);
    dispatch(fetchSessions({
      from: from.toISOString(),
      to: to.toISOString(),
      clientId: searchParams.get('clientId') ?? undefined,
    }));
  }, [currentDate, viewMode, dispatch, searchParams]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    dispatch(setCurrentDate(d.toISOString()));
  };

  const openCreate = (dateStr?: string) => {
    setEditSession(null);
    setModalDefaultDate(dateStr);
    setShowModal(true);
  };

  const openEdit = (s: SessionDto) => {
    setEditSession(s);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditSession(null);
    loadSessions();
  };

  return (
    <Page>
      <Header>
        <div>
          <Title>Agenda</Title>
          <Subtitle>// {sessions.length} sessões no período</Subtitle>
        </div>
        <Controls>
          <ViewToggle>
            <ViewBtn $active={viewMode === 'week'} onClick={() => dispatch(setViewMode('week'))}>Semana</ViewBtn>
            <ViewBtn $active={viewMode === 'month'} onClick={() => dispatch(setViewMode('month'))}>Mês</ViewBtn>
          </ViewToggle>
          <NavBtn onClick={() => navigate(-1)}>←</NavBtn>
          <TodayBtn onClick={() => dispatch(setCurrentDate(new Date().toISOString()))}>Hoje</TodayBtn>
          <NavBtn onClick={() => navigate(1)}>→</NavBtn>
          <NewSessionBtn onClick={() => openCreate()}>+ Sessão</NewSessionBtn>
        </Controls>
      </Header>

      <PeriodLabel>
        {viewMode === 'week' ? getWeekLabel(current) : getMonthLabel(current)}
      </PeriodLabel>

      {loading ? (
        <LoadingMsg>A carregar agenda...</LoadingMsg>
      ) : viewMode === 'week' ? (
        <WeekView
          current={current}
          sessions={sessions}
          onDayClick={(dateStr) => openCreate(dateStr)}
          onSessionClick={openEdit}
        />
      ) : (
        <MonthView
          current={current}
          sessions={sessions}
          onDayClick={(dateStr) => openCreate(dateStr)}
          onSessionClick={openEdit}
        />
      )}

      {showModal && (
        <SessionModal
          session={editSession}
          defaultDate={modalDefaultDate}
          clients={clients}
          onClose={closeModal}
        />
      )}
    </Page>
  );
};

// ─── Week View ────────────────────────────────────────────────────────────────

const WeekView: React.FC<{
  current: Date;
  sessions: SessionDto[];
  onDayClick: (dateStr: string) => void;
  onSessionClick: (s: SessionDto) => void;
}> = ({ current, sessions, onDayClick, onSessionClick }) => {
  const days = getWeekDays(current);
  const today = new Date().toDateString();

  return (
    <WeekGrid>
      {days.map((day) => {
        const daySessions = sessions.filter(
          (s) => new Date(s.scheduledAt).toDateString() === day.toDateString(),
        );
        const isToday = day.toDateString() === today;

        return (
          <DayColumn key={day.toISOString()}>
            <DayHeader $today={isToday}>
              <DayName>{day.toLocaleDateString('pt-PT', { weekday: 'short' })}</DayName>
              <DayNum $today={isToday}>{day.getDate()}</DayNum>
            </DayHeader>
            <DayBody onClick={() => onDayClick(day.toISOString().slice(0, 16))}>
              {daySessions.map((s) => (
                <SessionChip
                  key={s.id}
                  $color={STATUS_COLOR[s.status]}
                  onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
                >
                  <ChipTime>{new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</ChipTime>
                  <ChipName>{(s.client as any)?.name ?? 'Cliente'}</ChipName>
                  <ChipType>{TYPE_LABEL[s.type]}</ChipType>
                </SessionChip>
              ))}
            </DayBody>
          </DayColumn>
        );
      })}
    </WeekGrid>
  );
};

// ─── Month View ───────────────────────────────────────────────────────────────

const MonthView: React.FC<{
  current: Date;
  sessions: SessionDto[];
  onDayClick: (dateStr: string) => void;
  onSessionClick: (s: SessionDto) => void;
}> = ({ current, sessions, onDayClick, onSessionClick }) => {
  const cells = getMonthCells(current);
  const today = new Date().toDateString();
  const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <MonthGrid>
      {WEEK_DAYS.map((d) => <WeekDayLabel key={d}>{d}</WeekDayLabel>)}
      {cells.map((day, i) => {
        if (!day) return <MonthCell key={`empty-${i}`} $empty />;
        const daySessions = sessions.filter(
          (s) => new Date(s.scheduledAt).toDateString() === day.toDateString(),
        );
        const isToday = day.toDateString() === today;
        const isCurrentMonth = day.getMonth() === current.getMonth();

        return (
          <MonthCell key={day.toISOString()} $today={isToday} $dim={!isCurrentMonth}
            onClick={() => onDayClick(day.toISOString().slice(0, 16))}>
            <MonthDayNum $today={isToday}>{day.getDate()}</MonthDayNum>
            {daySessions.slice(0, 3).map((s) => (
              <MonthChip
                key={s.id}
                $color={STATUS_COLOR[s.status]}
                onClick={(e) => { e.stopPropagation(); onSessionClick(s); }}
              >
                {new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} {(s.client as any)?.name?.split(' ')[0]}
              </MonthChip>
            ))}
            {daySessions.length > 3 && (
              <MoreSessions>+{daySessions.length - 3}</MoreSessions>
            )}
          </MonthCell>
        );
      })}
    </MonthGrid>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDateRange(date: Date, mode: 'week' | 'month') {
  if (mode === 'week') {
    const start = new Date(date);
    const day = (start.getDay() + 6) % 7; // Monday = 0
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { from: start, to: end };
  } else {
    const from = new Date(date.getFullYear(), date.getMonth(), 1);
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { from, to };
  }
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function getMonthCells(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  const remainder = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < remainder; i++) cells.push(null);
  return cells;
}

function getWeekLabel(date: Date) {
  const days = getWeekDays(date);
  const start = days[0].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
  const end = days[6].toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${start} – ${end}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Page = styled.div`padding: 32px; max-width: 1200px;`;
const Header = styled.div`display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;`;
const Title = styled.h1`font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #e8e8f0;`;
const Subtitle = styled.p`font-family: 'DM Mono', monospace; font-size: 11px; color: #666677; margin-top: 4px;`;
const Controls = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;
const ViewToggle = styled.div`display: flex; background: #18181f; border: 1px solid #2a2a35; border-radius: 6px; overflow: hidden;`;
const ViewBtn = styled.button<{ $active?: boolean }>`padding: 8px 14px; border: none; background: ${({ $active }) => $active ? '#c8f542' : 'transparent'}; color: ${({ $active }) => $active ? '#0a0a0f' : '#666677'}; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.15s; &:hover { color: ${({ $active }) => $active ? '#0a0a0f' : '#e8e8f0'}; }`;
const NavBtn = styled.button`background: #18181f; border: 1px solid #2a2a35; color: #e8e8f0; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 16px; transition: all 0.15s; &:hover { border-color: #c8f542; }`;
const TodayBtn = styled.button`background: transparent; border: 1px solid #2a2a35; color: #666677; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-family: 'DM Mono', monospace; font-size: 12px; transition: all 0.15s; &:hover { border-color: #666677; color: #e8e8f0; }`;
const NewSessionBtn = styled.button`background: #c8f542; color: #0a0a0f; border: none; border-radius: 6px; padding: 8px 16px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.15s; &:hover { background: #d4ff55; }`;
const PeriodLabel = styled.div`font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #e8e8f0; margin-bottom: 16px; text-transform: capitalize;`;
const LoadingMsg = styled.p`font-family: 'DM Mono', monospace; color: #666677; font-size: 13px; padding: 48px 0;`;

// Week
const WeekGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; min-height: 500px;`;
const DayColumn = styled.div`display: flex; flex-direction: column; min-height: 500px;`;
const DayHeader = styled.div<{ $today?: boolean }>`padding: 10px 8px; text-align: center; border-bottom: 2px solid ${({ $today }) => $today ? '#c8f542' : '#2a2a35'};`;
const DayName = styled.div`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; letter-spacing: 2px; text-transform: uppercase;`;
const DayNum = styled.div<{ $today?: boolean }>`font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: ${({ $today }) => $today ? '#c8f542' : '#e8e8f0'}; margin-top: 2px;`;
const DayBody = styled.div`flex: 1; padding: 8px 4px; display: flex; flex-direction: column; gap: 4px; cursor: pointer; &:hover { background: rgba(200,245,66,0.02); border-radius: 4px; }`;
const SessionChip = styled.div<{ $color: string }>`background: ${({ $color }) => $color}18; border: 1px solid ${({ $color }) => $color}44; border-left: 3px solid ${({ $color }) => $color}; border-radius: 4px; padding: 5px 7px; cursor: pointer; transition: background 0.15s; &:hover { background: ${({ $color }) => $color}28; }`;
const ChipTime = styled.div`font-family: 'DM Mono', monospace; font-size: 9px; color: #666677;`;
const ChipName = styled.div`font-size: 12px; color: #e8e8f0; font-weight: 500; margin: 1px 0;`;
const ChipType = styled.div`font-family: 'DM Mono', monospace; font-size: 9px; color: #666677;`;

// Month
const MonthGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;`;
const WeekDayLabel = styled.div`font-family: 'DM Mono', monospace; font-size: 10px; color: #666677; text-align: center; padding: 8px 0; letter-spacing: 2px;`;
const MonthCell = styled.div<{ $today?: boolean; $dim?: boolean; $empty?: boolean }>`
  min-height: 100px; background: ${({ $today }) => $today ? 'rgba(200,245,66,0.04)' : '#111118'};
  border: 1px solid ${({ $today }) => $today ? 'rgba(200,245,66,0.2)' : '#1e1e28'};
  border-radius: 6px; padding: 6px; cursor: ${({ $empty }) => $empty ? 'default' : 'pointer'};
  opacity: ${({ $dim }) => $dim ? 0.4 : 1};
  transition: background 0.15s;
  &:hover { ${({ $empty }) => !$empty && 'background: rgba(200,245,66,0.03);'} }
`;
const MonthDayNum = styled.div<{ $today?: boolean }>`font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: ${({ $today }) => $today ? '#c8f542' : '#e8e8f0'}; margin-bottom: 4px;`;
const MonthChip = styled.div<{ $color: string }>`font-family: 'DM Mono', monospace; font-size: 9px; padding: 2px 5px; border-radius: 3px; background: ${({ $color }) => $color}18; color: ${({ $color }) => $color}; border: 1px solid ${({ $color }) => $color}33; margin-bottom: 2px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer;`;
const MoreSessions = styled.div`font-family: 'DM Mono', monospace; font-size: 9px; color: #666677; padding: 1px 4px;`;
