'use client';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { clientsApi, sessionsApi } from '../../../../lib/api/clients.api';
import { programsApi } from '../../../../lib/api/prescription.api';
import { invoicesApi, InvoiceDto } from '../../../../lib/api/invoices.api';
import { habitsApi } from '../../../../lib/api/habits.api';
import { progressPhotosApi, ProgressPhoto } from '../../../../lib/api/progress-photos.api';
import { statsApi } from '../../../../lib/api/stats.api';
import { EmptyState } from '../../../../components/ui';
import {
  INVOICE_STATUS_STYLE, INVOICE_STATUS_LABEL,
  SESSION_STATUS_LABEL, SESSION_STATUS_STYLE, SESSION_TYPE_LABEL,
  LEVEL_STYLE,
} from '../../../../lib/constants/styles';

type Tab = 'overview' | 'programs' | 'sessions' | 'assessments' | 'fotos' | 'habitos' | 'pagamentos';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',    label: 'Visão geral', icon: 'person' },
  { id: 'programs',    label: 'Planos',      icon: 'fitness_center' },
  { id: 'sessions',    label: 'Sessões',     icon: 'calendar_today' },
  { id: 'assessments', label: 'Avaliações',  icon: 'assignment' },
  { id: 'fotos',       label: 'Fotos',       icon: 'photo_camera' },
  { id: 'habitos',     label: 'Hábitos',     icon: 'check_circle' },
  { id: 'pagamentos',  label: 'Pagamentos',  icon: 'payments' },
];

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoAngle, setPhotoAngle] = useState('Frontal');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [savingHabit, setSavingHabit] = useState(false);

  const { data: client } = useSWR(clientId ? `client-${clientId}` : null, () => clientsApi.getDetail(clientId!));
  const { data: stats } = useSWR(clientId ? `stats-${clientId}` : null, () => statsApi.getClient(clientId!));
  const { data: programs = [], mutate: mutatePrograms } = useSWR(clientId ? `programs-${clientId}` : null, () => programsApi.getByClient(clientId!));
  const { data: sessions = [] } = useSWR(tab === 'sessions' && clientId ? `sessions-${clientId}` : null, () => sessionsApi.getAll({ clientId: clientId! }));
  const { data: invoices = [] } = useSWR(tab === 'pagamentos' && clientId ? `invoices-${clientId}` : null, () => invoicesApi.getAll(clientId!));
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
    return <EmptyState icon="person" title="A carregar..." />;
  }

  const user = client as any;
  const name = user.client?.name ?? user.email;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push('/clients')}
        className="font-label font-bold text-xs text-secondary hover:text-primary mb-6 flex items-center gap-1 transition-colors"
      >
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Clientes
      </button>

      {/* Header */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-start gap-5">
          {/* Avatar + progress ring */}
          <div className="relative flex-shrink-0 w-20 h-20">
            {stats?.attendanceRate != null ? (
              <svg className="absolute inset-0" width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" className="text-surface-container-high" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="36" fill="none"
                  stroke="#005050" strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - (stats.attendanceRate / 100))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
            ) : null}
            <div className="absolute inset-[6px] rounded-full kinetic-gradient flex items-center justify-center font-headline font-black text-on-primary text-2xl shadow-ambient">
              {name?.[0]?.toUpperCase() ?? '?'}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">{name}</h1>
            <p className="font-label text-sm text-secondary mt-0.5">{user.email}</p>
            {user.client?.phone && <p className="font-label text-xs text-secondary">{user.client.phone}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {stats?.attendanceRate != null && (
                <span className="label-category text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                  {stats.attendanceRate}% presença
                </span>
              )}
              {stats?.activeProgram && (
                <span className="label-category bg-surface-container-high rounded-full px-2 py-0.5 text-secondary truncate max-w-[160px]">
                  {stats.activeProgram}
                </span>
              )}
              {stats?.currentLevel && (
                <span className={`label-category px-2 py-0.5 rounded-full ${LEVEL_STYLE[stats.currentLevel] ?? 'bg-surface-container text-secondary'}`}>
                  {stats.currentLevel}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push(`/prescription?clientId=${clientId}`)}
            className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-base">description</span>
            Prescrição
          </button>
        </div>

        {/* Quick stats row */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-outline-variant/10">
            {[
              { label: 'Sessões', value: stats.totalSessions },
              { label: 'Presença', value: `${stats.attendanceRate}%` },
              { label: 'Planos', value: stats.totalPrograms ?? '—' },
              { label: 'Logs', value: stats.totalWorkoutLogs ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-headline font-black text-xl text-on-surface">{value}</div>
                <div className="label-category mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-outline-variant/20">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`font-label font-bold text-xs px-4 py-3 border-b-2 transition-colors whitespace-nowrap -mb-px flex items-center gap-1.5 ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-sm" style={tab === t.id ? { fontVariationSettings: "'FILL' 1" } : undefined}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {user.client?.notes && (
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <p className="label-category mb-2">Notas</p>
              <p className="font-body text-sm text-on-surface">{user.client.notes}</p>
            </div>
          )}
          {(stats?.assessmentHistory?.length ?? 0) > 0 && (
            <div>
              <h2 className="font-headline font-bold text-lg text-on-surface mb-3">Histórico de avaliações</h2>
              {stats?.assessmentHistory?.slice(0, 3).map((a) => (
                <div key={a.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 mb-2 shadow-sm flex items-center gap-3">
                  <span className={`label-category px-2 py-0.5 rounded ${LEVEL_STYLE[a.level] ?? 'bg-surface-container text-secondary'}`}>{a.level}</span>
                  <span className="font-label text-xs text-secondary flex-1">{new Date(a.date).toLocaleDateString('pt-PT')}</span>
                  {a.flags?.slice(0, 2).map(f => (
                    <span key={f} className="label-category text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{f}</span>
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
          <div className="flex justify-end mb-5">
            <button
              onClick={() => router.push(`/prescription?clientId=${clientId}`)}
              className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Novo plano
            </button>
          </div>
          {programs.length === 0 ? (
            <EmptyState icon="fitness_center" title="Nenhum plano criado." />
          ) : (
            <div className="flex flex-col gap-3">
              {programs.map((p: any) => (
                <div key={p.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-headline font-bold text-base text-on-surface">{p.name}</div>
                    <div className="font-label text-xs text-secondary mt-0.5">{new Date(p.createdAt).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <span className={`label-category px-2 py-0.5 rounded ${p.status === 'ACTIVE' ? 'text-primary bg-primary-fixed' : 'text-secondary bg-surface-container'}`}>
                    {p.status === 'ACTIVE' ? 'Activo' : 'Arquivado'}
                  </span>
                  <button
                    onClick={() => router.push(`/workouts?programId=${p.id}&clientId=${clientId}`)}
                    className="font-label font-bold text-xs text-secondary bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Treinos
                  </button>
                  <button
                    onClick={() => handleDeleteProgram(p.id)}
                    className="text-error hover:bg-error/5 p-1.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
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
          <div className="flex justify-end mb-5">
            <button
              onClick={() => router.push(`/schedule?clientId=${clientId}`)}
              className="bg-surface-container-high text-on-surface font-label font-bold text-sm px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-surface-container-highest transition-colors"
            >
              <span className="material-symbols-outlined text-base">calendar_month</span>
              Gerir agenda
            </button>
          </div>
          {sessions.length === 0 ? (
            <EmptyState icon="calendar_today" title="Nenhuma sessão agendada." />
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.slice().sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)).map((s) => (
                <div key={s.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 shadow-sm flex items-center gap-3">
                  <div className="flex-1">
                    <div className="font-body text-sm font-semibold text-on-surface">{SESSION_TYPE_LABEL[s.type]}</div>
                    <div className="font-label text-xs text-secondary mt-0.5">
                      {new Date(s.scheduledAt).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}
                      {' · '}{new Date(s.scheduledAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}{s.duration} min
                    </div>
                  </div>
                  <span className={`label-category ${(SESSION_STATUS_STYLE[s.status] ?? SESSION_STATUS_STYLE.SCHEDULED).text}`}>{SESSION_STATUS_LABEL[s.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photos */}
      {tab === 'fotos' && (
        <div>
          <div className="flex gap-3 mb-6 flex-wrap items-end">
            <select
              value={photoAngle}
              onChange={e => setPhotoAngle(e.target.value)}
              className="bg-surface-container-highest border-none rounded-lg px-3 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
            >
              {['Frontal', 'Lateral', 'Posterior', 'Outro'].map(a => <option key={a}>{a}</option>)}
            </select>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-4 py-2.5 rounded-lg disabled:opacity-40 flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              {uploadingPhoto ? 'A carregar...' : 'Foto'}
            </button>
          </div>
          {photos.length === 0 ? (
            <EmptyState icon="photo_camera" title="Nenhuma foto de progresso." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(photos as ProgressPhoto[]).map((photo) => (
                <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-surface-container-lowest shadow-sm">
                  <img src={photo.url} alt={photo.angle} className="w-full h-44 object-cover" />
                  <div className="p-2.5">
                    <div className="label-category">{photo.angle} · {new Date(photo.takenAt).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-on-surface/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
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
          <div className="flex gap-2 mb-6">
            <input
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
              placeholder="Nome do hábito..."
              className="flex-1 bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary outline-none transition-all"
            />
            <button
              onClick={handleAddHabit}
              disabled={savingHabit || !newHabitName}
              className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
            >
              {savingHabit ? '...' : 'Adicionar'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {habits.map((h) => (
              <div key={h.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 shadow-sm flex items-center gap-3">
                {h.icon && <span className="text-xl">{h.icon}</span>}
                <div className="flex-1">
                  <div className="font-body text-sm font-semibold text-on-surface">{h.name}</div>
                  <div className="font-label text-xs text-secondary">{h.frequency}</div>
                </div>
                <div className={`w-2 h-2 rounded-full ${h.isActive ? 'bg-primary' : 'bg-outline'}`} />
                <button onClick={() => handleDeleteHabit(h.id)} className="text-outline hover:text-error p-1 transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
            {habits.length === 0 && <EmptyState icon="check_circle" title="Sem hábitos definidos." size="section" />}
          </div>
        </div>
      )}

      {/* Invoices */}
      {tab === 'pagamentos' && (
        <div className="flex flex-col gap-2">
          {invoices.length === 0 ? (
            <EmptyState icon="payments" title="Sem facturas." />
          ) : (
            invoices.map((inv: InvoiceDto) => {
              const st = INVOICE_STATUS_STYLE[inv.status] ?? INVOICE_STATUS_STYLE.PENDING;
              return (
                <div key={inv.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                  <div className="flex-1">
                    <div className="font-body text-sm font-semibold text-on-surface">{inv.description}</div>
                    <div className="font-label text-xs text-secondary">Vence: {new Date(inv.dueDate).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <div className={`font-headline font-black text-base ${st.text}`}>
                    {inv.amount.toFixed(2)} {inv.currency}
                  </div>
                  <span className={`label-category px-2 py-0.5 rounded-full ${st.badge}`}>{INVOICE_STATUS_LABEL[inv.status]}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Assessments */}
      {tab === 'assessments' && (
        <div className="flex flex-col gap-3">
          {stats?.assessmentHistory?.length === 0 ? (
            <EmptyState icon="assignment" title="Sem avaliações." />
          ) : (
            stats?.assessmentHistory?.map((a) => (
              <div key={a.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`label-category px-2 py-0.5 rounded ${LEVEL_STYLE[a.level] ?? 'bg-surface-container text-secondary'}`}>{a.level}</span>
                  <span className="font-label text-xs text-secondary">
                    {new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                {a.flags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {a.flags.map((f) => (
                      <span key={f} className="label-category text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{f}</span>
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
