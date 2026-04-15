'use client';
import { useState } from 'react';
import { useAuthStore } from '../../../lib/stores/authStore';

const SECTION_CLS = 'bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden';
const ITEM_CLS = 'flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 last:border-0';
const INPUT_CLS = 'bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors w-full max-w-xs';
const LABEL_CLS = 'text-[10px] font-bold uppercase tracking-widest text-secondary';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSMS, setNotifSMS] = useState(false);
  const [lang, setLang] = useState('pt-PT');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaved, setPwSaved] = useState(false);

  const handlePwSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm) return;
    // TODO: call auth API to update password
    setPwSaved(true);
    setTimeout(() => { setPwSaved(false); setPwForm({ current: '', next: '', confirm: '' }); }, 2500);
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <span className="label-category text-primary">Configuração</span>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mt-1">Definições</h1>
      </div>

      {/* ── Conta ───────────────────────────────────────────────── */}
      <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-secondary mb-3">Conta</h2>
      <div className={`${SECTION_CLS} mb-6`}>
        <div className={ITEM_CLS}>
          <div>
            <div className={LABEL_CLS}>E-mail</div>
            <div className="text-sm font-medium text-on-surface mt-0.5">{user?.email ?? '—'}</div>
          </div>
          <span className="label-category text-outline bg-surface-container-high px-2 py-1 rounded-lg">
            {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'CLIENT' ? 'Cliente' : 'PT'}
          </span>
        </div>
        <div className={ITEM_CLS}>
          <div>
            <div className={LABEL_CLS}>Idioma</div>
            <div className="text-sm text-secondary mt-0.5">Língua da interface</div>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-surface-container-high border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors"
          >
            <option value="pt-PT">Português (PT)</option>
            <option value="en-US">English (US)</option>
          </select>
        </div>
      </div>

      {/* ── Notificações ────────────────────────────────────────── */}
      <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-secondary mb-3">Notificações</h2>
      <div className={`${SECTION_CLS} mb-6`}>
        {[
          { label: 'Notificações por e-mail', desc: 'Receber lembretes e relatórios por e-mail', value: notifEmail, set: setNotifEmail },
          { label: 'Notificações por SMS', desc: 'Receber alertas de sessão via SMS', value: notifSMS, set: setNotifSMS },
        ].map(({ label, desc, value, set }) => (
          <div key={label} className={ITEM_CLS}>
            <div>
              <div className="text-sm font-medium text-on-surface">{label}</div>
              <div className="text-xs text-secondary mt-0.5">{desc}</div>
            </div>
            <button
              role="switch"
              aria-checked={value}
              onClick={() => set(!value)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-outline-variant'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Alterar palavra-passe ───────────────────────────────── */}
      <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-secondary mb-3">Segurança</h2>
      <div className={`${SECTION_CLS} mb-6`}>
        <form onSubmit={handlePwSave} className="px-5 py-5 space-y-4">
          {[
            { label: 'Palavra-passe actual', key: 'current', type: 'password' },
            { label: 'Nova palavra-passe', key: 'next', type: 'password' },
            { label: 'Confirmar nova palavra-passe', key: 'confirm', type: 'password' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className={`${LABEL_CLS} block mb-1.5`}>{label}</label>
              <input
                type={type}
                value={pwForm[key as keyof typeof pwForm]}
                onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))}
                className={INPUT_CLS}
                autoComplete={key === 'current' ? 'current-password' : 'new-password'}
              />
            </div>
          ))}
          {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
            <p className="text-xs text-error">As palavras-passe não coincidem.</p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm}
              className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
            >
              {pwSaved ? 'Guardado!' : 'Actualizar palavra-passe'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Zona de perigo ──────────────────────────────────────── */}
      <h2 className="font-headline font-bold text-xs uppercase tracking-widest text-secondary mb-3">Zona de perigo</h2>
      <div className={SECTION_CLS}>
        <div className={ITEM_CLS}>
          <div>
            <div className="text-sm font-medium text-error">Eliminar conta</div>
            <div className="text-xs text-secondary mt-0.5">Apaga todos os dados permanentemente. Irreversível.</div>
          </div>
          <button
            onClick={() => window.confirm('Tens a certeza? Esta acção é irreversível.') && alert('Contacta o administrador para eliminar a conta.')}
            className="label-category text-error border border-error/20 px-3 py-2 rounded-lg hover:bg-error/5 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
