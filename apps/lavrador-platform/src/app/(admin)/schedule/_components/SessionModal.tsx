'use client';
import { useState } from 'react';
import { Modal, InputField, SelectField, TextareaField } from '../../../../components/ui';
import { sessionsApi } from '../../../../lib/api/clients.api';
import { SessionDto, SessionType, SessionStatus, CreateSessionRequest, UpdateSessionRequest, UserDto } from '@libs/types';

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'TRAINING', label: 'Treino' },
  { value: 'ASSESSMENT', label: 'Avaliação' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
];

const SESSION_STATUSES: { value: SessionStatus; label: string }[] = [
  { value: 'SCHEDULED', label: 'Agendada' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
  { value: 'NO_SHOW', label: 'Falta' },
];

/** Convert a datetime-local string (Lisbon local time) to a proper ISO offset string */
function toISOLisbon(localStr: string): string {
  const naive = new Date(localStr);
  const lisbon = new Date(naive.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
  const offsetMs = naive.getTime() - lisbon.getTime();
  const offsetMin = offsetMs / 60000;
  const sign = offsetMin <= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${localStr}:00${sign}${hh}:${mm}`;
}

interface Props {
  session: SessionDto | null;
  initialDate?: string;
  clients: UserDto[];
  onClose: () => void;
  onSaved: () => void;
}

type FormState = {
  clientId: string;
  scheduledAt: string;
  duration: string;
  type: SessionType;
  status: SessionStatus;
  notes: string;
};

function initForm(session: SessionDto | null, initialDate?: string): FormState {
  if (session) {
    return {
      clientId: session.clientId,
      scheduledAt: new Date(session.scheduledAt).toISOString().slice(0, 16),
      duration: String(session.duration),
      type: session.type,
      status: session.status,
      notes: session.notes ?? '',
    };
  }
  return {
    clientId: '',
    scheduledAt: initialDate ?? new Date().toISOString().slice(0, 16),
    duration: '60',
    type: 'TRAINING',
    status: 'SCHEDULED',
    notes: '',
  };
}

export function SessionModal({ session, initialDate, clients, onClose, onSaved }: Props) {
  const isEdit = !!session;
  const [form, setForm] = useState<FormState>(() => initForm(session, initialDate));
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSave() {
    if (!form.clientId) return;
    setSaving(true);
    try {
      if (isEdit) {
        await sessionsApi.update(session!.id, {
          scheduledAt: toISOLisbon(form.scheduledAt),
          duration: Number(form.duration),
          type: form.type,
          status: form.status,
          notes: form.notes || undefined,
        } as UpdateSessionRequest);
      } else {
        await sessionsApi.create({
          clientId: form.clientId,
          scheduledAt: toISOLisbon(form.scheduledAt),
          duration: Number(form.duration),
          type: form.type,
          notes: form.notes || undefined,
        } as CreateSessionRequest);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!session || !window.confirm('Eliminar esta sessão?')) return;
    await sessionsApi.remove(session.id);
    onSaved();
  }

  const footer = (
    <div className="flex gap-2 justify-between">
      {isEdit ? (
        <button
          onClick={handleDelete}
          className="font-label font-bold text-xs text-error border border-error/20 px-3 py-2 rounded-lg hover:bg-error/5 transition-colors"
        >
          Eliminar
        </button>
      ) : <div />}
      <div className="flex gap-2">
        <button onClick={onClose} className="text-sm text-secondary hover:text-on-surface px-4 py-2 transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !form.clientId}
          className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-6 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
        >
          {saving ? '...' : 'Guardar'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal title={isEdit ? 'Editar sessão' : 'Nova sessão'} onClose={onClose} footer={footer}>
      <SelectField
        label="Cliente"
        value={form.clientId}
        onChange={(e) => set('clientId', e.target.value)}
        disabled={isEdit}
      >
        <option value="">Seleccionar...</option>
        {clients.map((c: any) => (
          <option key={c.id} value={c.client?.id ?? c.id}>
            {c.client?.name ?? c.email}
          </option>
        ))}
      </SelectField>

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="Data/hora"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => set('scheduledAt', e.target.value)}
        />
        <InputField
          label="Duração (min)"
          type="number"
          value={form.duration}
          min={15}
          step={15}
          onChange={(e) => set('duration', e.target.value)}
        />
        <SelectField
          label="Tipo"
          value={form.type}
          onChange={(e) => set('type', e.target.value as SessionType)}
        >
          {SESSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </SelectField>
        {isEdit && (
          <SelectField
            label="Estado"
            value={form.status}
            onChange={(e) => set('status', e.target.value as SessionStatus)}
          >
            {SESSION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </SelectField>
        )}
      </div>

      <TextareaField
        label="Notas"
        value={form.notes}
        rows={2}
        onChange={(e) => set('notes', e.target.value)}
      />
    </Modal>
  );
}
