'use client';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { clientsApi } from '../../../../lib/api/clients.api';
import { programsApi } from '../../../../lib/api/prescription.api';
import { invoicesApi, InvoiceDto } from '../../../../lib/api/invoices.api';
import { sessionsApi } from '../../../../lib/api/clients.api';
import { habitsApi } from '../../../../lib/api/habits.api';
import { progressPhotosApi, ProgressPhoto } from '../../../../lib/api/progress-photos.api';
import { statsApi } from '../../../../lib/api/stats.api';

type Tab = 'overview' | 'programs' | 'sessions' | 'assessments' | 'fotos' | 'habitos' | 'pagamentos';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'programs', label: 'Planos' },
  { id: 'sessions', label: 'Sessões' },
  { id: 'assessments', label: 'Avaliações' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'habitos', label: 'Hábitos' },
  { id: 'pagamentos', label: 'Pagamentos' },
];

const INV_STATUS_COLOR: Record<string, string> = {
  PENDING: '#42a5f5', PAID: '#c8f542', OVERDUE: '#ff3b3b', CANCELLED: '#666677',
};
const INV_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Em atraso', CANCELLED: 'Cancelado',
};
const SESS_STATUS_COLOR: Record<string, string> = {
  SCHEDULED: '#42a5f5', COMPLETED: '#c8f542', CANCELLED: '#ff3b3b', NO_SHOW: '#ff8c5a',
};
const SESS_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada', COMPLETED: 'Concluída', CANCELLED: 'Cancelada', NO_SHOW: 'Falta',
};
const SESS_TYPE_LABEL: Record<string, string> = {
  TRAINING: 'Treino', ASSESSMENT: 'Avaliação', FOLLOWUP: 'Follow-up',
};
const LEVEL_COLOR: Record<string, string> = {
  INICIANTE: '#ff8c5a', INTERMEDIO: '#42a5f5', AVANCADO: '#c8f542',
  iniciante: '#ff8c5a', intermedio: '#42a5f5', avancado: '#c8f542',
};

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoAngle, setPhotoAngle] = useState('Frontal');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [savingHabit, setSavingHabit] = useState(false);

  const { data: client } = useSWR(clientId ? `client-${clientId}` : null, () => clientsApi.getById(clientId!));
  const { data: stats } = useSWR(clientId ? `stats-${clientId}` : null, () => statsApi.getClient(clientId!));
  const { data: programs = [], mutate: mutatePrograms } = useSWR(clientId ? `programs-${clientId}` : null, () => programsApi.getByClient(clientId!));
  const { data: sessions = [] } = useSWR(tab === 'sessions' && clientId ? `sessions-${clientId}` : null, () => sessionsApi.getAll({ clientId: clientId! }));
  const { data: invoices = [], mutate: mutateInvoices } = useSWR(tab === 'pagamentos' && clientId ? `invoices-${clientId}` : null, () => invoicesApi.getAll(clientId!));
  const { data: habits = [], mutate: mutateHabits } = useSWR(tab === 'habitos' && clientId ? `habits-${clientId}` : null, () => habitsApi.getByClient(clientId!));
  const { data: photos = [], mutate: mutatePhotos } = useSWR(tab === 'fotos' && clientId ? `photos-${clientId}` : null, () => progressPhotosApi.getByClient(clientId!));

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !clientId) return;
    setUploadingPhoto(true);
    try {
      await progressPhotosApi.upload(clientId, file, { angle: photoAngle, takenAt: new Date().toISOString() });
      mutatePhotos();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally { setUploadingPhoto(false); }
  }

  async function handleDeletePhoto(id: string) {
    if (!window.confirm('Eliminar esta foto?')) return;
    await progressPhotosApi.delete(id);
    mutatePhotos();
  }

  async function handleAddHabit() {
    if (!newHabitName.trim() || !clientId) return;
    setSavingHabit(true);
    try {
      await habitsApi.createForClient(clientId, { name: newHabitName.trim() });
      setNewHabitName('');
      mutateHabits();
    } finally { setSavingHabit(false); }
  }

  async function handleDeleteHabit(id: string) {
    if (!window.confirm('Eliminar hábito?')) return;
    await habitsApi.delete(id);
    mutateHabits();
  }

  async function handleDeleteProgram(id: string) {
    if (!window.confirm('Eliminar este plano?')) return;
    await programsApi.delete(id);
    mutatePrograms();
  }

  if (!client) {
    return <div className="py-20 font-mono text-sm text-muted text-center">A carregar...</div>;
  }

  const user = client as any;
  const name = user.client?.name ?? user.email;

  return (
    <div>
      {/* Back + header */}
      <button onClick={() => router.push('/clients')} className="font-mono text-xs text-muted hover:text-white mb-4 flex items-center gap-1">
        ← Clientes
      </button>

      <div className="flex items-start gap-5 mb-6">
        <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-syne font-black text-accent text-2xl flex-shrink-0">
          {name[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="font-syne font-black text-2xl text-white">{name}</h1>
          <p className="font-mono text-xs text-muted mt-0.5">{user.email}</p>
          {user.client?.phone && <p className="font-mono text-xs text-muted">{user.client.phone}</p>}
        </div>
        <button onClick={() => router.push(`/prescription?clientId=${clientId}`)}
          className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90">
          + Prescrição
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border pb-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`font-mono text-xs px-4 py-2 border-b-2 transition-colors whitespace-nowrap -mb-px ${
              tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && stats && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Sessões totais', val: stats.totalSessions, color: '#42a5f5' },
              { label: 'Taxa comparência', val: `${stats.attendanceRate}%`, color: '#c8f542' },
              { label: 'Plano activo', val: stats.activeProgram ?? 'Nenhum', color: '#f5a442', small: true },
              { label: 'Nível actual', val: stats.currentLevel, color: LEVEL_COLOR[stats.currentLevel] ?? '#888' },
            ].map(({ label, val, color, small }) => (
              <div key={label} className="bg-panel border border-border rounded-xl p-4" style={{ borderTopColor: color, borderTopWidth: 2 }}>
                <div className={`font-syne font-black ${small ? 'text-base' : 'text-2xl'}`} style={{ color }}>{val}</div>
                <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1">{label}</div>
              </div>
            ))}
          </div>
          {user.client?.notes && (
            <div className="bg-panel border border-border rounded-xl p-4">
              <div className="font-mono text-[10px] text-muted uppercase tracking-widest mb-2">Notas</div>
              <p className="font-sans text-sm text-white">{user.client.notes}</p>
            </div>
          )}
          {stats.assessmentHistory?.length > 0 && (
            <div>
              <h2 className="font-syne font-bold text-sm text-white mb-3">Histórico de avaliações</h2>
              {stats.assessmentHistory.slice(0, 3).map((a) => (
                <div key={a.id} className="bg-panel border border-border rounded-lg px-4 py-3 mb-2 flex items-center gap-3">
                  <span className="font-syne font-bold text-sm" style={{ color: LEVEL_COLOR[a.level] ?? '#888' }}>{a.level}</span>
                  <span className="font-mono text-xs text-muted flex-1">{new Date(a.date).toLocaleDateString('pt-PT')}</span>
                  {a.flags?.length > 0 && a.flags.slice(0, 2).map(f => (
                    <span key={f} className="font-mono text-[9px] text-orange-400 border border-orange-400/20 rounded px-1.5 py-0.5">{f}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Programs */}
      {tab === 'programs' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => router.push(`/prescription?clientId=${clientId}`)}
              className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90">
              + Novo plano
            </button>
          </div>
          {programs.length === 0 ? (
            <div className="py-20 font-mono text-sm text-muted text-center">Nenhum plano criado.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {programs.map((p: any) => (
                <div key={p.id} className="bg-panel border border-border rounded-xl px-5 py-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-syne font-bold text-base text-white">{p.name}</div>
                    <div className="font-mono text-[10px] text-muted mt-0.5">{new Date(p.createdAt).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: p.status === 'ACTIVE' ? '#c8f542' : '#666677' }}>
                    {p.status === 'ACTIVE' ? 'Activo' : 'Arquivado'}
                  </span>
                  <button onClick={() => router.push(`/workouts?programId=${p.id}&clientId=${clientId}`)}
                    className="font-mono text-xs text-muted border border-border rounded-lg px-3 py-1.5 hover:text-white hover:border-muted transition-colors">
                    Treinos
                  </button>
                  <button onClick={() => handleDeleteProgram(p.id)}
                    className="font-mono text-xs text-red-400 border border-red-400/20 rounded-lg px-3 py-1.5 hover:border-red-400/40 transition-colors">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sessions */}
      {tab === 'sessions' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => router.push(`/schedule?clientId=${clientId}`)}
              className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90">
              Gerir agenda
            </button>
          </div>
          {sessions.length === 0 ? (
            <div className="py-20 font-mono text-sm text-muted text-center">Nenhuma sessão agendada.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.slice().sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).map((s) => (
                <div key={s.id} className="bg-panel border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SESS_STATUS_COLOR[s.status] }} />
                  <div className="flex-1">
                    <div className="font-sans text-sm text-white">{SESS_TYPE_LABEL[s.type]}</div>
                    <div className="font-mono text-xs text-muted">
                      {new Date(s.scheduledAt).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}
                      {' · '}{new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{s.duration} min
                    </div>
                  </div>
                  <span className="font-mono text-xs" style={{ color: SESS_STATUS_COLOR[s.status] }}>{SESS_STATUS_LABEL[s.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      {tab === 'fotos' && (
        <div>
          <div className="flex gap-3 mb-5 flex-wrap items-end">
            <select value={photoAngle} onChange={e => setPhotoAngle(e.target.value)}
              className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans focus:outline-none">
              {['Frontal', 'Lateral', 'Posterior', 'Outro'].map(a => <option key={a}>{a}</option>)}
            </select>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
              className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50">
              {uploadingPhoto ? 'A carregar...' : '+ Foto'}
            </button>
          </div>
          {photos.length === 0 ? (
            <div className="py-20 font-mono text-sm text-muted text-center">Nenhuma foto de progresso.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(photos as ProgressPhoto[]).map((photo) => (
                <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-panel border border-border">
                  <img src={photo.url} alt={photo.angle} className="w-full h-44 object-cover" />
                  <div className="p-2">
                    <div className="font-mono text-[10px] text-muted">{photo.angle} · {new Date(photo.takenAt).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <button onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Habits */}
      {tab === 'habitos' && (
        <div>
          <div className="flex gap-2 mb-5">
            <input value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="Nome do hábito..."
              className="flex-1 bg-panel border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent" />
            <button onClick={handleAddHabit} disabled={savingHabit || !newHabitName}
              className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {savingHabit ? '...' : 'Adicionar'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {habits.map((h) => (
              <div key={h.id} className="bg-panel border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                {h.icon && <span className="text-xl">{h.icon}</span>}
                <div className="flex-1">
                  <div className="font-sans text-sm text-white">{h.name}</div>
                  <div className="font-mono text-[10px] text-muted">{h.frequency}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${h.isActive ? 'bg-accent' : 'bg-faint'}`} />
                <button onClick={() => handleDeleteHabit(h.id)} className="font-mono text-xs text-red-400 hover:text-red-300">✕</button>
              </div>
            ))}
            {habits.length === 0 && (
              <div className="py-10 font-mono text-sm text-muted text-center">Sem hábitos definidos.</div>
            )}
          </div>
        </div>
      )}

      {/* Invoices */}
      {tab === 'pagamentos' && (
        <div className="flex flex-col gap-2">
          {invoices.length === 0 ? (
            <div className="py-20 font-mono text-sm text-muted text-center">Sem facturas.</div>
          ) : (
            invoices.map((inv: InvoiceDto) => (
              <div key={inv.id} className="bg-panel border border-border rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: INV_STATUS_COLOR[inv.status] }} />
                <div className="flex-1">
                  <div className="font-sans text-sm text-white">{inv.description}</div>
                  <div className="font-mono text-[10px] text-muted">Vence: {new Date(inv.dueDate).toLocaleDateString('pt-PT')}</div>
                </div>
                <div className="font-syne font-black text-base" style={{ color: INV_STATUS_COLOR[inv.status] }}>
                  {inv.amount.toFixed(2)} {inv.currency}
                </div>
                <span className="font-mono text-xs" style={{ color: INV_STATUS_COLOR[inv.status] }}>{INV_STATUS_LABEL[inv.status]}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Assessments */}
      {tab === 'assessments' && (
        <div className="flex flex-col gap-3">
          {stats?.assessmentHistory?.length === 0 ? (
            <div className="py-20 font-mono text-sm text-muted text-center">Sem avaliações.</div>
          ) : (
            stats?.assessmentHistory?.map((a) => (
              <div key={a.id} className="bg-panel border border-border rounded-xl px-5 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-syne font-bold text-base" style={{ color: LEVEL_COLOR[a.level] ?? '#888' }}>{a.level}</span>
                  <span className="font-mono text-xs text-muted">{new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
                {a.flags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {a.flags.map((f) => (
                      <span key={f} className="font-mono text-[9px] text-orange-400 border border-orange-400/20 rounded px-1.5 py-0.5">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
