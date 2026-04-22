'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { sessionsApi, clientsApi } from '../../../lib/api/clients.api';
import { SessionDto } from '@libs/types';
import { PageHeader } from '../../../components/ui';
import { SESSION_STATUS_STYLE, SESSION_STATUS_LABEL, SESSION_TYPE_LABEL } from '../../../lib/constants/styles';
import { SessionModal } from './_components/SessionModal';

// ─── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const WEEKDAY_SHORT = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

type ViewMode = 'month' | 'week' | 'day';

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  const from = new Date(d);
  from.setDate(d.getDate() - day);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(from.getDate() + 6);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function getMonthRange(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0);
  const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) grid.push(null);
  for (let d = 1; d <= last.getDate(); d++) grid.push(new Date(year, month, d));
  return grid;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const today = new Date();
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(today);
  const [modal, setModal] = useState<{ session: SessionDto | null; initialDate?: string } | null>(null);

  const { from, to } = view === 'month'
    ? getMonthRange(currentDate)
    : view === 'day'
    ? {
        from: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0),
        to:   new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59),
      }
    : getWeekRange(currentDate);

  const { data: sessions = [], isLoading, mutate } = useSWR<SessionDto[]>(
    ['sessions', from.toISOString(), view],
    () => sessionsApi.getAll({ from: from.toISOString(), to: to.toISOString() }),
  );
  const { data: clients = [] } = useSWR('clients-all', clientsApi.getAll);

  const openCreate = (dateStr?: string) => setModal({ session: null, initialDate: dateStr });
  const openEdit   = (s: SessionDto)      => setModal({ session: s });
  const closeModal = () => setModal(null);
  const onSaved    = () => { mutate(); closeModal(); };

  const isToday   = (d: Date) => d.toDateString() === today.toDateString();
  const dateKey   = (d: Date) => d.toISOString().slice(0, 10);
  const daySess   = (d: Date) =>
    sessions.filter((s) => s.scheduledAt.slice(0, 10) === dateKey(d))
            .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  function rangeLabel() {
    if (view === 'day') return currentDate.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' });
    if (view === 'week') {
      const { from: wf, to: wt } = getWeekRange(currentDate);
      return `${wf.getDate()} ${MONTHS_SHORT[wf.getMonth()]} — ${wt.getDate()} ${MONTHS_SHORT[wt.getMonth()]}`;
    }
    return `${MONTHS_PT[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  }

  const weekDays = view === 'week'
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(getWeekRange(currentDate).from);
        d.setDate(d.getDate() + i);
        return d;
      })
    : [];

  const monthGrid = view === 'month'
    ? buildMonthGrid(currentDate.getFullYear(), currentDate.getMonth())
    : [];

  const SessionChip = ({ s }: { s: SessionDto }) => {
    const st = SESSION_STATUS_STYLE[s.status] ?? SESSION_STATUS_STYLE.SCHEDULED;
    return (
      <button
        onClick={() => openEdit(s)}
        className={`w-full text-left rounded-lg px-2 py-1.5 border-l-2 ${st.bg} ${st.border} hover:opacity-80 transition-opacity`}
      >
        <div className={`label-category ${st.text}`}>
          {new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="font-body text-[10px] text-on-surface-variant truncate">{SESSION_TYPE_LABEL[s.type]}</div>
      </button>
    );
  };

  const headerAction = (
    <>
      <div className="flex bg-surface-container-high rounded-lg p-0.5 gap-0.5">
        {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`label-category px-3 py-1.5 rounded-md transition-colors ${
              view === v ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-secondary hover:text-on-surface'
            }`}
          >
            {{ day: 'Dia', week: 'Semana', month: 'Mês' }[v]}
          </button>
        ))}
      </div>
      <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary transition-colors">
        <span className="material-symbols-outlined text-lg">chevron_left</span>
      </button>
      <span className="font-headline font-bold text-sm text-on-surface px-2 min-w-[160px] text-center capitalize">{rangeLabel()}</span>
      <button onClick={() => navigate(1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-secondary transition-colors">
        <span className="material-symbols-outlined text-lg">chevron_right</span>
      </button>
      <button onClick={() => setCurrentDate(new Date())} className="label-category text-primary bg-primary-fixed px-3 py-2 rounded-lg hover:bg-primary-fixed/60 transition-colors flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">today</span>
        Hoje
      </button>
      <a
        href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333'}/api/sessions/export/ical`}
        download="lavrador-sessions.ics"
        className="bg-surface-container-high text-on-surface font-label font-bold text-xs px-3 py-2.5 rounded-lg hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
        title="Exportar para iCal"
      >
        <span className="material-symbols-outlined text-base">calendar_export</span>
        iCal
      </a>
      <button
        onClick={() => openCreate()}
        className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
      >
        <span className="material-symbols-outlined text-base">add</span>
        Sessão
      </button>
    </>
  );

  return (
    <div>
      <PageHeader
        label="Calendário"
        title="Agenda"
        subtitle={isLoading ? undefined : `${sessions.length} sessões`}
        action={headerAction}
        className="mb-6"
      />

      {/* ── WEEK VIEW ── */}
      {view === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`bg-surface-container-lowest rounded-xl overflow-hidden min-h-[140px] shadow-sm ${isToday(d) ? 'ring-2 ring-primary' : ''}`}
            >
              <div className={`px-2 py-2 text-center ${isToday(d) ? 'bg-primary' : 'bg-surface-container-low'}`}>
                <div className={`label-category ${isToday(d) ? 'text-on-primary' : ''}`}>{WEEKDAY_SHORT[i]}</div>
                <div className={`font-headline font-black text-xl ${isToday(d) ? 'text-on-primary' : 'text-on-surface'}`}>{d.getDate()}</div>
              </div>
              <div className="p-1.5 space-y-1">
                {daySess(d).map((s) => <SessionChip key={s.id} s={s} />)}
                <button
                  onClick={() => openCreate(d.toISOString().slice(0, 10) + 'T09:00')}
                  className="w-full text-center label-category text-outline hover:text-secondary py-1 transition-colors"
                >+</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MONTH VIEW ── */}
      {view === 'month' && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-outline-variant/10">
            {WEEKDAY_SHORT.map((d) => (
              <div key={d} className="label-category text-center py-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGrid.map((d, i) => {
              if (!d) return <div key={i} className="h-24 border-r border-b border-outline-variant/5 last:border-r-0" />;
              const ds = daySess(d);
              return (
                <div
                  key={i}
                  className={`h-24 border-r border-b border-outline-variant/5 last:border-r-0 p-1 overflow-hidden ${isToday(d) ? 'bg-primary-fixed/20' : ''}`}
                >
                  <div className={`label-category mb-1 flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday(d) ? 'kinetic-gradient text-on-primary' : 'text-secondary'
                  }`}>{d.getDate()}</div>
                  <div className="space-y-0.5">
                    {ds.slice(0, 2).map((s) => {
                      const st = SESSION_STATUS_STYLE[s.status] ?? SESSION_STATUS_STYLE.SCHEDULED;
                      return (
                        <button key={s.id} onClick={() => openEdit(s)}
                          className={`w-full text-left rounded px-1 py-0.5 border-l-2 ${st.bg} ${st.border} hover:opacity-80 transition-opacity`}>
                          <div className={`label-category truncate ${st.text}`}>
                            {new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} {SESSION_TYPE_LABEL[s.type]}
                          </div>
                        </button>
                      );
                    })}
                    {ds.length > 2 && <div className="label-category text-secondary pl-1">+{ds.length - 2}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DAY VIEW ── */}
      {view === 'day' && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4">
          <div className="text-center mb-4 pb-4 border-b border-outline-variant/10">
            <div className="font-headline font-black text-3xl text-on-surface capitalize">
              {currentDate.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
          </div>
          {daySess(currentDate).length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-3xl text-outline mb-2 block">event_available</span>
              <p className="text-sm text-secondary">Sem sessões neste dia.</p>
              <button onClick={() => openCreate(dateKey(currentDate) + 'T09:00')}
                className="mt-3 label-category text-primary hover:underline flex items-center gap-1 mx-auto">
                <span className="material-symbols-outlined text-sm">add</span> Adicionar sessão
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {daySess(currentDate).map((s) => {
                const st = SESSION_STATUS_STYLE[s.status] ?? SESSION_STATUS_STYLE.SCHEDULED;
                const client = (clients as any[]).find((c) => c.client?.id === s.clientId);
                return (
                  <button key={s.id} onClick={() => openEdit(s)}
                    className={`w-full text-left rounded-xl px-4 py-4 border-l-4 ${st.bg} ${st.border} hover:opacity-90 transition-opacity shadow-sm`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`font-headline font-bold text-base ${st.text}`}>
                          {new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          <span className="font-body text-sm ml-2">{SESSION_TYPE_LABEL[s.type]}</span>
                        </div>
                        {client && <div className="label-category mt-1">{client.client?.name ?? client.email}</div>}
                        {s.notes && <div className="font-label text-xs text-secondary mt-1 italic">{s.notes}</div>}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`label-category px-2 py-1 rounded-lg ${st.bg} ${st.text}`}>
                          {SESSION_STATUS_LABEL[s.status]}
                        </span>
                        <div className="label-category mt-1">{s.duration} min</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              <button onClick={() => openCreate(dateKey(currentDate) + 'T09:00')}
                className="w-full border border-dashed border-outline-variant rounded-xl py-3 label-category text-secondary hover:text-on-surface hover:border-primary/30 transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">add</span> Adicionar sessão
              </button>
            </div>
          )}
        </div>
      )}

      {modal && (
        <SessionModal
          session={modal.session}
          initialDate={modal.initialDate}
          clients={clients as any}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
