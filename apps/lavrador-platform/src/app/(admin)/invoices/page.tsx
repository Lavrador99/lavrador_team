'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { invoicesApi, InvoiceDto, InvoiceStatus } from '../../../lib/api/invoices.api';
import { clientsApi } from '../../../lib/api/clients.api';
import { PageHeader, EmptyState, LoadingState, InputField, SelectField, TextareaField } from '../../../components/ui';
import { INVOICE_STATUS_STYLE, INVOICE_STATUS_LABEL } from '../../../lib/constants/styles';

const today = () => new Date().toISOString().split('T')[0];

export default function InvoicesPage() {
  const { data: invoices = [], isLoading, mutate } = useSWR<InvoiceDto[]>('invoices', invoicesApi.getAll);
  const { data: clients = [] } = useSWR('clients-list', clientsApi.getAll);
  const [filter, setFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientId: '', amount: '', currency: 'EUR', description: '', dueDate: today(), notes: '' });
  const [saving, setSaving] = useState(false);

  const filtered = filter === 'ALL' ? invoices : invoices.filter((i) => i.status === filter);
  const totalPaid    = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0);

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.amount || !form.description) return;
    setSaving(true);
    try {
      await invoicesApi.create({
        clientId: form.clientId,
        amount: Number(form.amount),
        currency: form.currency,
        description: form.description,
        dueDate: form.dueDate,
        notes: form.notes || undefined,
      });
      setForm({ clientId: '', amount: '', currency: 'EUR', description: '', dueDate: today(), notes: '' });
      setShowForm(false);
      mutate();
    } finally { setSaving(false); }
  };

  const handleStatus = async (id: string, status: InvoiceStatus) => {
    await invoicesApi.update(id, { status });
    mutate();
  };

  return (
    <div>
      <PageHeader
        label="Financeiro"
        title="Facturação"
        subtitle={`${invoices.length} facturas`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-5 py-2.5 rounded-lg shadow-ambient flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            Nova factura
          </button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border-l-4 border-primary">
          <span className="label-category">Recebido</span>
          <div className="font-headline font-black text-3xl text-primary mt-2">{totalPaid.toFixed(2)} €</div>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
          <span className="label-category">Pendente</span>
          <div className="font-headline font-black text-3xl text-blue-600 mt-2">{totalPending.toFixed(2)} €</div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface-container-lowest rounded-xl p-6 mb-6 space-y-4 shadow-sm">
          <h3 className="font-headline font-bold text-base text-on-surface">Nova factura</h3>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Cliente" value={form.clientId} onChange={(e) => set('clientId', e.target.value)} required>
              <option value="">Seleccionar cliente</option>
              {(clients as any[]).map((c) => (
                <option key={c.id} value={c.client?.id ?? c.id}>{c.client?.name ?? c.email}</option>
              ))}
            </SelectField>
            <div className="flex gap-2">
              <InputField label="Valor" type="number" step="0.01" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0.00" required />
              <SelectField label="Moeda" value={form.currency} onChange={(e) => set('currency', e.target.value)} className="w-24">
                <option>EUR</option><option>USD</option><option>GBP</option>
              </SelectField>
            </div>
            <InputField label="Descrição" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descrição *" required />
            <InputField label="Data de vencimento" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
          <TextareaField label="Notas" value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Notas (opcional)" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-secondary hover:text-on-surface px-4 py-2 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="kinetic-gradient text-on-primary font-headline font-bold text-sm px-6 py-2.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all">
              {saving ? '...' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['ALL', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`font-label font-bold text-xs px-3 py-1.5 rounded-lg transition-colors ${
              filter === s ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-secondary hover:text-on-surface'
            }`}
          >
            {s === 'ALL' ? 'Todas' : INVOICE_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState icon="receipt_long" title="Nenhuma factura encontrada." size="section" />
          ) : (
            filtered.map((inv, idx) => {
              const st = INVOICE_STATUS_STYLE[inv.status] ?? INVOICE_STATUS_STYLE.PENDING;
              return (
                <div
                  key={inv.id}
                  className={`px-5 py-4 flex items-center gap-4 ${idx < filtered.length - 1 ? 'border-b border-outline-variant/10' : ''}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-body text-sm font-semibold text-on-surface">{inv.description}</div>
                    <div className="font-label text-xs text-secondary mt-0.5">
                      Vence: {new Date(inv.dueDate).toLocaleDateString('pt-PT')}
                    </div>
                  </div>
                  <div className={`font-headline font-black text-base ${st.text}`}>
                    {inv.amount.toFixed(2)} {inv.currency}
                  </div>
                  <span className={`label-category px-2 py-0.5 rounded-full ${st.badge}`}>
                    {INVOICE_STATUS_LABEL[inv.status]}
                  </span>
                  <select
                    value={inv.status}
                    onChange={(e) => handleStatus(inv.id, e.target.value as InvoiceStatus)}
                    className="bg-surface-container-high border-none rounded-lg px-2 py-1.5 font-label text-xs text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    {Object.entries(INVOICE_STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
