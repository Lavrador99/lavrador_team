'use client';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, createElement } from 'react';
import { ProgramPhase } from '@libs/types';
import { clientsApi, sessionsApi } from '../../../../lib/api/clients.api';
import { programsApi, assessmentsApi } from '../../../../lib/api/prescription.api';
import { downloadPdf } from '../../../../lib/pdf/downloadPdf';
import { AssessmentReportPdf } from '../../../../lib/pdf/AssessmentReportPdf';
import { invoicesApi, InvoiceDto } from '../../../../lib/api/invoices.api';
import { habitsApi } from '../../../../lib/api/habits.api';
import { progressPhotosApi, ProgressPhoto } from '../../../../lib/api/progress-photos.api';
import { statsApi } from '../../../../lib/api/stats.api';
import { bodyMeasurementsApi } from '../../../../lib/api/body-measurements.api';
import { EmptyState } from '../../../../components/ui';
import { ClientTimeline } from '../../../../components/clients/ClientTimeline';
import { useAuthStore } from '../../../../lib/stores/authStore';
import {
  INVOICE_STATUS_STYLE, INVOICE_STATUS_LABEL,
  SESSION_STATUS_LABEL, SESSION_STATUS_STYLE, SESSION_TYPE_LABEL,
  LEVEL_STYLE,
} from '../../../../lib/constants/styles';

type Tab = 'overview' | 'programs' | 'sessions' | 'assessments' | 'fotos' | 'habitos' | 'pagamentos' | 'timeline' | 'dor' | 'forma' | 'pacotes' | 'contratos';

const PATTERN_LABEL: Record<string, string> = {
  EMPURRAR_HORIZONTAL: 'Peito',
  PUXAR_VERTICAL: 'Costas V.',
  PUXAR_HORIZONTAL: 'Costas H.',
  EMPURRAR_VERTICAL: 'Ombros',
  DOMINANTE_JOELHO: 'Pernas Q.',
  DOMINANTE_ANCA: 'Pernas G.',
  CORE: 'Core',
  LOCOMOCAO: 'Full Body',
};

function ProgramPhasePanel({ phase, index }: { phase: ProgramPhase; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-surface-container rounded-xl mb-2 overflow-hidden border border-outline-variant/10">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-6 h-6 rounded kinetic-gradient flex items-center justify-center font-label font-bold text-on-primary text-[10px] flex-shrink-0">
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 text-left">
          <div className="font-headline font-bold text-xs text-on-surface" dangerouslySetInnerHTML={{ __html: phase.name }} />
          <div className="font-label text-[10px] text-secondary">{phase.sub} · {phase.weeks} sem.</div>
        </div>
        <span className="material-symbols-outlined text-outline text-sm" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>expand_more</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-outline-variant/10">
          <p className="font-body text-xs text-secondary mt-3 mb-3 leading-relaxed">{phase.description}</p>
          <div className="flex flex-wrap gap-1 mb-3">
            {phase.method?.map((m) => (
              <span key={m} className="label-category px-2 py-0.5 rounded bg-blue-50 text-blue-700">{m}</span>
            ))}
          </div>
          {[
            { title: 'Cardiovascular', icon: 'directions_run', cls: 'text-blue-700', data: phase.cardio, fields: ['freq', 'intensidade', 'tempo', 'tipo', 'volume', 'progressao'] },
            { title: 'Força', icon: 'fitness_center', cls: 'text-primary', data: phase.forca, fields: ['freq', 'intensidade', 'series', 'intervalo', 'velocidade', 'progressao'] },
            { title: 'Flexibilidade', icon: 'self_improvement', cls: 'text-orange-600', data: phase.flex, fields: ['freq', 'tipo', 'tempo', 'volume', 'foco'] },
          ].map(({ title, icon, cls, data, fields }) => (
            <div key={title} className="mb-3">
              <p className={`label-category mb-1.5 flex items-center gap-1 ${cls}`}>
                <span className="material-symbols-outlined text-sm">{icon}</span>{title}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {fields.map((f) => {
                  const d = data as Record<string, string> | undefined;
                  return d?.[f] ? (
                    <div key={f} className="bg-surface-container-lowest rounded p-2 border border-outline-variant/10">
                      <p className="label-category mb-0.5">{f}</p>
                      <p className="font-body text-xs text-on-surface leading-relaxed" style={{ whiteSpace: 'pre-line' }}>{d[f]}</p>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ))}
          {phase.weekByWeek?.length > 0 && (
            <table className="w-full text-xs mt-2 border-collapse">
              <thead>
                <tr>{['Semana', 'Força', 'Cardio', 'Flex'].map((h) => (
                  <th key={h} className="text-left py-1.5 px-2 label-category border-b border-outline-variant/10">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {phase.weekByWeek.map((w, wi) => (
                  <tr key={wi} className="border-b border-outline-variant/5 last:border-0">
                    <td className="py-1.5 px-2 label-category">S{w.wk}</td>
                    <td className="py-1.5 px-2 font-body text-xs text-on-surface">{w.forca}</td>
                    <td className="py-1.5 px-2 font-body text-xs text-on-surface">{w.cardio}</td>
                    <td className="py-1.5 px-2 font-body text-xs text-on-surface">{w.flex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview',    label: 'Visão geral', icon: 'person' },
  { id: 'programs',    label: 'Planos',      icon: 'fitness_center' },
  { id: 'sessions',    label: 'Sessões',     icon: 'calendar_today' },
  { id: 'assessments', label: 'Avaliações',  icon: 'assignment' },
  { id: 'fotos',       label: 'Fotos',       icon: 'photo_camera' },
  { id: 'habitos',     label: 'Hábitos',     icon: 'check_circle' },
  { id: 'pagamentos',  label: 'Pagamentos',  icon: 'payments' },
  { id: 'timeline',    label: 'Timeline',    icon: 'timeline' },
  { id: 'dor',         label: 'Dores',       icon: 'report' },
  { id: 'forma',       label: 'Forma',       icon: 'videocam' },
  { id: 'pacotes',     label: 'Pacotes',     icon: 'confirmation_number' },
  { id: 'contratos',   label: 'Contratos',   icon: 'description' },
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
  const [cloningId, setCloningId] = useState<string | null>(null);
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const { data: client } = useSWR(clientId ? `client-${clientId}` : null, () => clientsApi.getDetail(clientId!));
  const { data: stats } = useSWR(clientId ? `stats-${clientId}` : null, () => statsApi.getClient(clientId!));
  const { data: programs = [], mutate: mutatePrograms } = useSWR(clientId ? `programs-${clientId}` : null, () => programsApi.getByClient(clientId!));
  const { data: sessions = [] } = useSWR(tab === 'sessions' && clientId ? `sessions-${clientId}` : null, () => sessionsApi.getAll({ clientId: clientId! }));
  const { data: invoices = [] } = useSWR(tab === 'pagamentos' && clientId ? `invoices-${clientId}` : null, () => invoicesApi.getAll(clientId!));
  const { data: habits = [], mutate: mutateHabits } = useSWR(tab === 'habitos' && clientId ? `habits-${clientId}` : null, () => habitsApi.getByClient(clientId!));
  const { data: photos = [], mutate: mutatePhotos } = useSWR(tab === 'fotos' && clientId ? `photos-${clientId}` : null, () => progressPhotosApi.getByClient(clientId!));
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
  const accessToken = useAuthStore((s) => s.accessToken);
  const authHeaders = (extra: Record<string, string> = {}) => ({
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...extra,
  });

  const { data: recentReadiness = [] } = useSWR(
    tab === 'overview' && clientId ? `readiness-${clientId}` : null,
    () => fetch(`${API_BASE}/api/readiness/client/${clientId}?limit=3`, { credentials: 'include', headers: authHeaders({}) }).then((r) => r.json()),
  );
  const { data: achievements = [] } = useSWR(
    tab === 'overview' && clientId ? `achievements-${clientId}` : null,
    () => fetch(`${API_BASE}/api/achievements/client/${clientId}`, { credentials: 'include', headers: authHeaders({}) }).then((r) => r.json()),
  );
  const { data: painReports = [], mutate: mutatePain } = useSWR(
    tab === 'dor' && clientId ? `pain-${clientId}` : null,
    () => fetch(`${API_BASE}/api/pain-reports/client/${clientId}`, { credentials: 'include', headers: authHeaders({}) }).then((r) => r.json()),
  );
  const { data: formChecks = [], mutate: mutateFormChecks } = useSWR(
    tab === 'forma' && clientId ? `form-checks-${clientId}` : null,
    () => fetch(`${API_BASE}/api/form-checks/client/${clientId}`, { credentials: 'include', headers: authHeaders({}) }).then((r) => r.json()),
  );
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const { data: sessionPackages = [], mutate: mutatePackages } = useSWR(
    tab === 'pacotes' && clientId ? `packages-${clientId}` : null,
    () => fetch(`${API_BASE}/api/session-packages/client/${clientId}`, { credentials: 'include', headers: authHeaders({}) }).then((r) => r.json()),
  );
  const { data: contracts = [], mutate: mutateContracts } = useSWR(
    tab === 'contratos' && clientId ? `contracts-${clientId}` : null,
    () => fetch(`${API_BASE}/api/contracts/client/${clientId}`, { credentials: 'include', headers: authHeaders({}) }).then((r) => r.json()),
  );
  const [newPkg, setNewPkg] = useState({ name: '', totalSessions: 10, priceEur: 100 });
  const [savingPkg, setSavingPkg] = useState(false);
  const [newContract, setNewContract] = useState({ title: '', content: '' });
  const [savingContract, setSavingContract] = useState(false);

  async function createPackage() {
    if (!clientId || !newPkg.name.trim()) return;
    setSavingPkg(true);
    try {
      await fetch(`${API_BASE}/api/session-packages`, {
        method: 'POST', headers: authHeaders(), credentials: 'include',
        body: JSON.stringify({ ...newPkg, clientId }),
      });
      mutatePackages();
      setNewPkg({ name: '', totalSessions: 10, priceEur: 100 });
    } finally { setSavingPkg(false); }
  }

  async function usePackageSession(pkgId: string) {
    await fetch(`${API_BASE}/api/session-packages/${pkgId}/use`, { method: 'PATCH', credentials: 'include', headers: authHeaders({}) });
    mutatePackages();
  }

  async function createContract() {
    if (!clientId || !newContract.title.trim() || !newContract.content.trim()) return;
    setSavingContract(true);
    try {
      const res = await fetch(`${API_BASE}/api/contracts`, {
        method: 'POST', headers: authHeaders(), credentials: 'include',
        body: JSON.stringify({ ...newContract, clientId }),
      });
      if (!res.ok) throw new Error('Erro ao criar contrato');
      mutateContracts();
      setNewContract({ title: '', content: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar contrato');
    } finally { setSavingContract(false); }
  }

  async function saveEmail() {
    if (!clientId || !emailDraft.trim()) return;
    setSavingEmail(true);
    try {
      await fetch(`${API_BASE}/api/users/clients/${clientId}/email`, {
        method: 'PATCH', headers: authHeaders(), credentials: 'include',
        body: JSON.stringify({ email: emailDraft.trim() }),
      });
      setEditingEmail(false);
    } catch { alert('Erro ao actualizar email'); }
    finally { setSavingEmail(false); }
  }

  async function resolvePain(id: string) {
    await fetch(`${API_BASE}/api/pain-reports/${id}/resolve`, { method: 'PATCH', credentials: 'include', headers: authHeaders({}) });
    mutatePain();
  }

  async function submitFormReview(id: string) {
    const feedback = feedbackInputs[id];
    if (!feedback?.trim()) return;
    setReviewingId(id);
    try {
      await fetch(`${API_BASE}/api/form-checks/${id}/review`, {
        method: 'PATCH',
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ptFeedback: feedback }),
      });
      mutateFormChecks();
      setFeedbackInputs((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } finally {
      setReviewingId(null);
    }
  }

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

  async function handleCloneProgram(id: string) {
    if (!clientId) return;
    setCloningId(id);
    try {
      await programsApi.clone(id, clientId);
      mutatePrograms();
    } finally { setCloningId(null); }
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
            {editingEmail ? (
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  className="text-sm border border-outline-variant rounded-lg px-2 py-1 outline-none focus:border-primary bg-white text-on-surface"
                  autoFocus
                />
                <button onClick={saveEmail} disabled={savingEmail}
                  className="text-xs font-bold text-primary hover:underline disabled:opacity-50">
                  {savingEmail ? '...' : 'Guardar'}
                </button>
                <button onClick={() => setEditingEmail(false)} className="text-xs text-secondary hover:underline">Cancelar</button>
              </div>
            ) : (
              <p className="font-label text-sm text-secondary mt-0.5 flex items-center gap-1">
                {user.email}
                <button onClick={() => { setEmailDraft(user.email); setEditingEmail(true); }}
                  className="text-outline hover:text-primary transition-colors ml-1">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </p>
            )}
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

          {/* Readiness last 3 check-ins */}
          {Array.isArray(recentReadiness) && recentReadiness.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <p className="label-category mb-3">Prontidão recente</p>
              <div className="space-y-2">
                {recentReadiness.map((log: any) => {
                  const score = Math.round((((log.sleep + log.energy) / 2 - (log.stress + log.soreness) / 2) + 4) / 8 * 100);
                  const color = score >= 70 ? 'text-primary' : score >= 40 ? 'text-amber-400' : 'text-red-400';
                  return (
                    <div key={log.id} className="flex items-center justify-between">
                      <span className="font-label text-xs text-secondary">
                        {new Date(log.date).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="font-label text-xs text-secondary">
                        😴{log.sleep} ⚡{log.energy} 😤{log.stress} 💪{log.soreness}
                      </span>
                      <span className={`font-headline font-bold text-sm ${color}`}>{score}/100</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Achievements */}
          {Array.isArray(achievements) && achievements.length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
              <p className="label-category mb-3">Conquistas ({achievements.length})</p>
              <div className="flex flex-wrap gap-2">
                {achievements.map((a: any) => (
                  <span
                    key={a.id}
                    title={a.description}
                    className="flex items-center gap-1.5 bg-surface-container-high rounded-full px-3 py-1.5 font-label text-xs text-on-surface"
                  >
                    <span>{a.icon}</span>{a.name}
                  </span>
                ))}
              </div>
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
              {programs.map((p: any) => {
                const isExpanded = expandedProgramId === p.id;
                const phases = (p.phases ?? []) as ProgramPhase[];
                const selections = (p.exerciseSelections ?? []) as any[];
                const selByPattern = selections.reduce((acc: Record<string, string[]>, sel: any) => {
                  const label = PATTERN_LABEL[sel.pattern] ?? sel.pattern;
                  if (!acc[label]) acc[label] = [];
                  if (sel.exercise?.name) acc[label].push(sel.exercise.name);
                  return acc;
                }, {});
                return (
                  <div key={p.id} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-headline font-bold text-base text-on-surface">{p.name}</div>
                        <div className="font-label text-xs text-secondary mt-0.5">
                          {new Date(p.createdAt).toLocaleDateString('pt-PT')}
                          {phases.length > 0 && ` · ${phases.length} fases · ${phases.reduce((a: number, ph: ProgramPhase) => a + (ph.weeks || 0), 0)} sem.`}
                          {selections.length > 0 && ` · ${selections.length} exerc.`}
                        </div>
                      </div>
                      <span className={`label-category px-2 py-0.5 rounded flex-shrink-0 ${p.status === 'ACTIVE' ? 'text-primary bg-primary-fixed' : 'text-secondary bg-surface-container'}`}>
                        {p.status === 'ACTIVE' ? 'Activo' : 'Arquivado'}
                      </span>
                      <button
                        onClick={() => setExpandedProgramId(isExpanded ? null : p.id)}
                        className={`font-label font-bold text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 ${isExpanded ? 'text-primary bg-primary-fixed' : 'text-secondary bg-surface-container-high hover:bg-surface-container-highest'}`}
                      >
                        <span className="material-symbols-outlined text-sm">description</span>
                        Prescrição
                      </button>
                      <button
                        onClick={() => router.push(`/workouts?programId=${p.id}&clientId=${clientId}`)}
                        className="font-label font-bold text-xs text-secondary bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        Treinos
                      </button>
                      <button
                        onClick={() => handleCloneProgram(p.id)}
                        disabled={cloningId === p.id}
                        className="font-label font-bold text-xs text-secondary bg-surface-container-high hover:bg-surface-container-highest px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1 flex-shrink-0"
                        title="Duplicar plano"
                      >
                        <span className="material-symbols-outlined text-sm">{cloningId === p.id ? 'hourglass_empty' : 'content_copy'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(p.id)}
                        className="text-error hover:bg-error/5 p-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-outline-variant/10 px-5 pb-5">
                        {Object.keys(selByPattern).length > 0 && (
                          <div className="mt-4 mb-5">
                            <p className="label-category text-primary mb-3 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">fitness_center</span>
                              Exercícios Selecionados
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(selByPattern).map(([label, names]) => (
                                <div key={label} className="bg-surface-container rounded-lg p-3 border border-outline-variant/10">
                                  <p className="label-category mb-1.5">{label}</p>
                                  {(names as string[]).map((n) => (
                                    <p key={n} className="font-body text-xs text-on-surface leading-relaxed">• {n}</p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {phases.length > 0 && (
                          <div>
                            <p className="label-category text-primary mb-3 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">auto_awesome</span>
                              Fases ACSM 2026
                            </p>
                            {phases.map((phase, i) => (
                              <ProgramPhasePanel key={i} phase={phase} index={i} />
                            ))}
                          </div>
                        )}

                        {phases.length === 0 && Object.keys(selByPattern).length === 0 && (
                          <p className="font-label text-xs text-secondary mt-4">Sem dados de prescrição disponíveis.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* Timeline */}
      {tab === 'timeline' && clientId && (
        <ClientTimeline clientId={clientId} />
      )}

      {/* Assessments */}
      {tab === 'assessments' && (
        <div className="flex flex-col gap-3">
          {stats?.assessmentHistory?.length === 0 ? (
            <EmptyState icon="assignment" title="Sem avaliações." />
          ) : (
            stats?.assessmentHistory?.map((a) => (
              <div key={a.id} className="bg-surface-container-lowest rounded-xl px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`label-category px-2 py-0.5 rounded ${LEVEL_STYLE[a.level] ?? 'bg-surface-container text-secondary'}`}>{a.level}</span>
                    <span className="font-label text-xs text-secondary">
                      {new Date(a.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const full = await assessmentsApi.getById(a.id);
                        const clientName = stats?.clientName ?? 'Cliente';
                        await downloadPdf(
                          `avaliacao-${clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
                          createElement(AssessmentReportPdf, { assessment: full, clientName }) as any,
                        );
                      } catch { /* ignore */ }
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                    title="Exportar PDF"
                  >
                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                    PDF
                  </button>
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

      {/* Pain Reports */}
      {tab === 'dor' && (
        <div className="space-y-3">
          {!Array.isArray(painReports) || painReports.length === 0 ? (
            <EmptyState icon="report" title="Sem reportes de dor." />
          ) : (
            (painReports as any[]).map((r) => {
              const intensityColor = ({ MILD: 'text-amber-400 bg-amber-400/10', MODERATE: 'text-orange-400 bg-orange-400/10', SEVERE: 'text-red-400 bg-red-400/10' } as Record<string,string>)[r.intensity] ?? '';
              return (
                <div key={r.id} className={`bg-surface-container-lowest rounded-xl p-4 ${r.resolvedAt ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-headline font-bold text-sm text-on-surface">{r.bodyPart}</div>
                      <div className="font-label text-xs text-secondary mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
                      </div>
                      {r.description && <p className="font-label text-xs text-secondary mt-1">{r.description}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`font-label text-xs font-bold px-2 py-1 rounded-full ${intensityColor}`}>
                        {({ MILD: 'Leve', MODERATE: 'Moderada', SEVERE: 'Severa' } as Record<string,string>)[r.intensity]}
                      </span>
                      {!r.resolvedAt ? (
                        <button onClick={() => resolvePain(r.id)} className="font-label text-xs text-primary hover:underline">Marcar resolvida</button>
                      ) : (
                        <span className="font-label text-xs text-primary">✓ Resolvida</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Form Checks */}
      {tab === 'forma' && (
        <div className="space-y-3">
          {!Array.isArray(formChecks) || formChecks.length === 0 ? (
            <EmptyState icon="videocam" title="Sem pedidos de análise de forma." />
          ) : (
            (formChecks as any[]).map((c) => (
              <div key={c.id} className="bg-surface-container-lowest rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-headline font-bold text-sm text-on-surface">{c.exerciseName}</div>
                    <div className="font-label text-xs text-secondary mt-0.5">{new Date(c.createdAt).toLocaleDateString('pt-PT')}</div>
                  </div>
                  <span className={`font-label text-xs font-bold px-2 py-1 rounded-full ${c.status === 'REVIEWED' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-secondary'}`}>
                    {c.status === 'REVIEWED' ? '✓ Analisado' : '⏳ Pendente'}
                  </span>
                </div>
                {c.notes && <p className="font-label text-xs text-secondary mb-2">{c.notes}</p>}
                <a href={c.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-label text-xs text-primary hover:underline mb-3">
                  <span className="material-symbols-outlined text-sm">play_circle</span>Ver vídeo
                </a>
                {c.ptFeedback && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 mb-3">
                    <p className="font-label text-xs text-primary font-bold mb-1">Feedback</p>
                    <p className="font-body text-sm text-on-surface">{c.ptFeedback}</p>
                  </div>
                )}
                {c.status === 'PENDING' && (
                  <div className="space-y-2">
                    <textarea
                      value={feedbackInputs[c.id] ?? ''}
                      onChange={(e) => setFeedbackInputs((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder="Escreve o feedback para o cliente..."
                      rows={2}
                      className="w-full bg-surface-container-high border-none rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-outline resize-none outline-none"
                    />
                    <button
                      onClick={() => submitFormReview(c.id)}
                      disabled={!feedbackInputs[c.id]?.trim() || reviewingId === c.id}
                      className="kinetic-gradient text-on-primary font-label font-bold text-xs px-4 py-2 rounded-lg disabled:opacity-40"
                    >
                      {reviewingId === c.id ? 'A enviar...' : 'Enviar feedback'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PACOTES TAB ── */}
      {tab === 'pacotes' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <p className="label-category mb-3">Novo pacote</p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="col-span-3">
                <input
                  value={newPkg.name}
                  onChange={(e) => setNewPkg((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Nome do pacote (ex: Pack Mensal 12)"
                  className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="label-category mb-1 block">Sessões</label>
                <input
                  type="number"
                  value={newPkg.totalSessions}
                  onChange={(e) => setNewPkg((p) => ({ ...p, totalSessions: Number(e.target.value) }))}
                  min={1}
                  className="w-full bg-surface-container-high border-none rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="label-category mb-1 block">Preço (€)</label>
                <input
                  type="number"
                  value={newPkg.priceEur}
                  onChange={(e) => setNewPkg((p) => ({ ...p, priceEur: Number(e.target.value) }))}
                  min={0}
                  className="w-full bg-surface-container-high border-none rounded-xl px-3 py-2.5 text-sm text-on-surface outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={createPackage}
                  disabled={!newPkg.name.trim() || savingPkg}
                  className="w-full kinetic-gradient text-on-primary font-label font-bold text-xs px-4 py-2.5 rounded-xl disabled:opacity-40"
                >
                  {savingPkg ? 'A criar...' : 'Criar pacote'}
                </button>
              </div>
            </div>
          </div>

          {!Array.isArray(sessionPackages) || sessionPackages.length === 0 ? (
            <EmptyState icon="confirmation_number" title="Sem pacotes de sessões." />
          ) : (
            (sessionPackages as any[]).map((pkg) => {
              const used = pkg.usedSessions ?? 0;
              const total = pkg.totalSessions ?? 0;
              const pct = total > 0 ? Math.round((used / total) * 100) : 0;
              const remaining = total - used;
              return (
                <div key={pkg.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-headline font-bold text-sm text-on-surface">{pkg.name}</div>
                      <div className="font-label text-xs text-secondary mt-0.5">
                        {new Date(pkg.createdAt).toLocaleDateString('pt-PT')} · €{pkg.priceEur}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-headline font-black text-xl text-on-surface">{remaining}</div>
                      <div className="font-label text-xs text-secondary">restantes</div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between label-category mb-1">
                      <span>{used} usadas</span>
                      <span>{total} total</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full kinetic-gradient rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => usePackageSession(pkg.id)}
                    disabled={remaining === 0}
                    className="label-category text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">remove_circle</span>
                    Registar sessão usada
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── CONTRATOS TAB ── */}
      {tab === 'contratos' && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
            <p className="label-category mb-3">Novo contrato</p>
            <div className="space-y-3">
              <input
                value={newContract.title}
                onChange={(e) => setNewContract((ct) => ({ ...ct, title: e.target.value }))}
                placeholder="Título do contrato"
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                value={newContract.content}
                onChange={(e) => setNewContract((ct) => ({ ...ct, content: e.target.value }))}
                placeholder="Conteúdo do contrato (texto completo)..."
                rows={6}
                className="w-full bg-surface-container-high border-none rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline resize-none outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={createContract}
                disabled={!newContract.title.trim() || !newContract.content.trim() || savingContract}
                className="kinetic-gradient text-on-primary font-label font-bold text-xs px-5 py-2.5 rounded-xl disabled:opacity-40"
              >
                {savingContract ? 'A criar...' : 'Criar e enviar ao cliente'}
              </button>
            </div>
          </div>

          {!Array.isArray(contracts) || contracts.length === 0 ? (
            <EmptyState icon="description" title="Sem contratos." />
          ) : (
            (contracts as any[]).map((ct) => (
              <div key={ct.id} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-headline font-bold text-sm text-on-surface">{ct.title}</div>
                    <div className="font-label text-xs text-secondary mt-0.5">
                      Criado em {new Date(ct.createdAt).toLocaleDateString('pt-PT')}
                      {ct.signedAt && ` · Assinado em ${new Date(ct.signedAt).toLocaleDateString('pt-PT')}`}
                    </div>
                    {ct.signedAt && (
                      <div className="font-label text-xs text-primary mt-1">
                        ✓ Assinado por <span className="font-bold italic">{ct.signatureName}</span>
                      </div>
                    )}
                  </div>
                  <span className={`font-label text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${ct.signedAt ? 'bg-primary/10 text-primary' : 'bg-amber-400/10 text-amber-400'}`}>
                    {ct.signedAt ? '✓ Assinado' : '⏳ Pendente'}
                  </span>
                </div>
                <div className="mt-3 bg-surface-container-high rounded-xl p-3 max-h-28 overflow-y-auto">
                  <p className="font-body text-xs text-secondary whitespace-pre-wrap leading-relaxed">{ct.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
