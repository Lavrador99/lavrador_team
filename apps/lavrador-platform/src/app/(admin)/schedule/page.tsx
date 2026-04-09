'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { sessionsApi, clientsApi } from '../../../lib/api/clients.api';
import { SessionDto, SessionType, SessionStatus, CreateSessionRequest, UpdateSessionRequest } from '@libs/types';

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#42a5f5', COMPLETED: '#c8f542', CANCELLED: '#ff3b3b', NO_SHOW: '#ff8c5a',
};
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada', COMPLETED: 'Concluída', CANCELLED: 'Cancelada', NO_SHOW: 'Falta',
};
const TYPE_LABEL: Record<string, string> = {
  TRAINING: 'Treino', ASSESSMENT: 'Avaliação', FOLLOWUP: 'Follow-up',
};
const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'TRAINING', label: 'Treino' }, { value: 'ASSESSMENT', label: 'Avaliação' }, { value: 'FOLLOWUP', label: 'Follow-up' },
];
const SESSION_STATUSES: { value: SessionStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Agendada' }, { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' }, { value: 'NO_SHOW', label: 'Falta' },
];

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

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

export default function SchedulePage() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const { from, to } = getWeekRange(currentDate);

  const { data: sessions = [], isLoading, mutate } = useSWR<SessionDto[]>(
    ['sessions', from.toISOString()],
    () => sessionsApi.getAll({ from: from.toISOString(), to: to.toISOString() }),
  );
  const { data: clients = [] } = useSWR('clients-all', clientsApi.getAll);

  const [showModal, setShowModal] = useState(false);
  const [editSession, setEditSession] = useState<SessionDto | null>(null);
  const [form, setForm] = useState<{
    clientId: string; scheduledAt: string; duration: string; type: SessionType; status: SessionStatus; notes: string;
  }>({ clientId: '', scheduledAt: '', duration: '60', type: 'TRAINING', status: 'SCHEDULED', notes: '' });
  const [saving, setSaving] = useState(false);

  function openCreate(dateStr?: string) {
    setEditSession(null);
    setForm({ clientId: '', scheduledAt: dateStr ?? new Date().toISOString().slice(0, 16), duration: '60', type: 'TRAINING', status: 'SCHEDULED', notes: '' });
    setShowModal(true);
  }

  function openEdit(s: SessionDto) {
    setEditSession(s);
    setForm({
      clientId: s.clientId,
      scheduledAt: new Date(s.scheduledAt).toISOString().slice(0, 16),
      duration: String(s.duration),
      type: s.type, status: s.status, notes: s.notes ?? '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.clientId) return;
    setSaving(true);
    try {
      if (editSession) {
        await sessionsApi.update(editSession.id, {
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          duration: Number(form.duration), type: form.type, status: form.status, notes: form.notes || undefined,
        } as UpdateSessionRequest);
      } else {
        await sessionsApi.create({
          clientId: form.clientId,
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          duration: Number(form.duration), type: form.type, notes: form.notes || undefined,
        } as CreateSessionRequest);
      }
      setShowModal(false);
      mutate();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editSession || !window.confirm('Eliminar esta sessão?')) return;
    await sessionsApi.remove(editSession.id);
    setShowModal(false);
    mutate();
  }

  // Build week days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return d;
  });
  const WEEKDAY = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  function daySessions(d: Date) {
    const key = d.toISOString().slice(0, 10);
    return sessions.filter((s) => s.scheduledAt.slice(0, 10) === key)
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  const inputCls = 'w-full bg-[#0d0d13] border border-border rounded-lg px-3 py-2 text-sm text-white font-sans focus:outline-none focus:border-accent';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-2xl text-white">Agenda</h1>
          <p className="font-mono text-xs text-muted mt-1">// {sessions.length} sessões nesta semana</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="text-muted hover:text-white px-2 text-lg">←</button>
          <span className="font-mono text-xs text-white">
            {from.getDate()} {MONTHS_PT[from.getMonth()]} — {to.getDate()} {MONTHS_PT[to.getMonth()]}
          </span>
          <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="text-muted hover:text-white px-2 text-lg">→</button>
          <button onClick={() => openCreate()} className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90 ml-2">
            + Sessão
          </button>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const daySess = daySessions(d);
          return (
            <div key={i} className={`bg-panel border rounded-xl overflow-hidden min-h-[140px] ${isToday ? 'border-accent/40' : 'border-border'}`}>
              <div className={`px-2 py-2 border-b text-center ${isToday ? 'border-accent/20 bg-accent/5' : 'border-border'}`}>
                <div className={`font-mono text-[10px] tracking-widest ${isToday ? 'text-accent' : 'text-muted'}`}>{WEEKDAY[i]}</div>
                <div className={`font-syne font-black text-lg ${isToday ? 'text-accent' : 'text-white'}`}>{d.getDate()}</div>
              </div>
              <div className="p-1.5 space-y-1">
                {daySess.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openEdit(s)}
                    className="w-full text-left rounded-lg px-2 py-1.5 transition-colors hover:opacity-80"
                    style={{ background: STATUS_COLOR[s.status] + '18', borderLeft: `2px solid ${STATUS_COLOR[s.status]}` }}
                  >
                    <div className="font-mono text-[9px]" style={{ color: STATUS_COLOR[s.status] }}>
                      {new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="font-sans text-[10px] text-white truncate">{TYPE_LABEL[s.type]}</div>
                  </button>
                ))}
                <button
                  onClick={() => openCreate(d.toISOString().slice(0, 10) + 'T09:00')}
                  className="w-full text-center font-mono text-[10px] text-faint hover:text-muted py-1"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="font-syne font-black text-lg text-white">{editSession ? 'Editar sessão' : 'Nova sessão'}</div>

            <div>
              <label className="font-mono text-[10px] text-muted tracking-widest uppercase block mb-1">Cliente</label>
              <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={inputCls} disabled={!!editSession}>
                <option value="">Seleccionar...</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.client?.id ?? c.id}>{c.client?.name ?? c.email}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] text-muted tracking-widest uppercase block mb-1">Data/hora</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted tracking-widest uppercase block mb-1">Duração (min)</label>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className={inputCls} min={15} step={15} />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted tracking-widest uppercase block mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SessionType }))} className={inputCls}>
                  {SESSION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {editSession && (
                <div>
                  <label className="font-mono text-[10px] text-muted tracking-widest uppercase block mb-1">Estado</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SessionStatus }))} className={inputCls}>
                    {SESSION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="font-mono text-[10px] text-muted tracking-widest uppercase block mb-1">Notas</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} rows={2} />
            </div>

            <div className="flex gap-2 justify-between pt-2">
              {editSession ? (
                <button onClick={handleDelete} className="font-mono text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded-lg border border-red-400/20 hover:border-red-400/40">
                  Eliminar
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="font-sans text-sm text-muted hover:text-white px-4 py-2">Cancelar</button>
                <button onClick={handleSave} disabled={saving || !form.clientId} className="bg-accent text-dark font-syne font-black text-sm px-5 py-2 rounded-lg disabled:opacity-50">
                  {saving ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
