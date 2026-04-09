'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { invoicesApi, InvoiceDto, InvoiceStatus } from '../../../lib/api/invoices.api';
import { clientsApi } from '../../../lib/api/clients.api';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  PENDING: 'Pendente', PAID: 'Pago', OVERDUE: 'Em atraso', CANCELLED: 'Cancelado',
};
const STATUS_COLOR: Record<InvoiceStatus, string> = {
  PENDING: '#42a5f5', PAID: '#c8f542', OVERDUE: '#ff3b3b', CANCELLED: '#444455',
};

const today = () => new Date().toISOString().split('T')[0];

export default function InvoicesPage() {
  const { data: invoices = [], isLoading, mutate } = useSWR<InvoiceDto[]>('invoices', invoicesApi.getAll);
  const { data: clients = [] } = useSWR('clients-list', clientsApi.getAll);
  const [filter, setFilter] = useState<InvoiceStatus | 'ALL'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientId: '', amount: '', currency: 'EUR', description: '', dueDate: today(), notes: '' });
  const [saving, setSaving] = useState(false);

  const filtered = filter === 'ALL' ? invoices : invoices.filter((i) => i.status === filter);
  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0);

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
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: InvoiceStatus) => {
    await invoicesApi.update(id, { status });
    mutate();
  };

  const inputCls = 'w-full bg-[#0d0d13] border border-border rounded-lg px-3 py-2 text-sm text-white font-sans placeholder-faint focus:outline-none focus:border-accent';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne font-black text-2xl text-white">Facturação</h1>
          <p className="font-mono text-xs text-muted mt-1">// {invoices.length} facturas</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-accent text-dark font-syne font-black text-sm px-4 py-2 rounded-lg hover:bg-accent/90">
          + Nova factura
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-panel border border-border rounded-xl p-4" style={{ borderTopColor: '#c8f542', borderTopWidth: 2 }}>
          <div className="font-syne font-black text-2xl text-accent">{totalPaid.toFixed(2)} €</div>
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1">Recebido</div>
        </div>
        <div className="bg-panel border border-border rounded-xl p-4" style={{ borderTopColor: '#42a5f5', borderTopWidth: 2 }}>
          <div className="font-syne font-black text-2xl text-[#42a5f5]">{totalPending.toFixed(2)} €</div>
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mt-1">Pendente</div>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-panel border border-border rounded-xl p-5 mb-6 space-y-3">
          <div className="font-mono text-[10px] text-muted tracking-widest uppercase mb-2">Nova factura</div>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={inputCls} required>
              <option value="">Seleccionar cliente</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.client?.id ?? c.id}>{c.client?.name ?? c.email}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={inputCls} placeholder="Valor" required />
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputCls + ' w-24'}>
                <option>EUR</option><option>USD</option><option>GBP</option>
              </select>
            </div>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Descrição *" required />
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className={inputCls} />
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls + ' resize-none'} rows={2} placeholder="Notas (opcional)" />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="font-sans text-sm text-muted hover:text-white px-4 py-2">Cancelar</button>
            <button type="submit" disabled={saving} className="bg-accent text-dark font-syne font-black text-sm px-5 py-2 rounded-lg disabled:opacity-50">
              {saving ? '...' : 'Criar'}
            </button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === s ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted hover:text-white'}`}>
            {s === 'ALL' ? 'Todas' : STATUS_LABEL[s as InvoiceStatus]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 font-mono text-sm text-muted text-center">A carregar...</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((inv) => (
            <div key={inv.id} className="bg-panel border border-border rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLOR[inv.status] }} />
              <div className="flex-1 min-w-0">
                <div className="font-sans text-sm text-white">{inv.description}</div>
                <div className="font-mono text-[10px] text-muted mt-0.5">
                  Vence: {new Date(inv.dueDate).toLocaleDateString('pt-PT')}
                </div>
              </div>
              <div className="font-syne font-black text-base" style={{ color: STATUS_COLOR[inv.status] }}>
                {inv.amount.toFixed(2)} {inv.currency}
              </div>
              <select
                value={inv.status}
                onChange={(e) => handleStatus(inv.id, e.target.value as InvoiceStatus)}
                className="bg-[#0d0d13] border border-border rounded-lg px-2 py-1 font-mono text-xs text-white focus:outline-none"
              >
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
