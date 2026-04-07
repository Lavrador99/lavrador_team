import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { invoicesApi, InvoiceDto, InvoiceStatus } from '../../utils/api/invoices.api';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  PENDING:   'Pendente',
  PAID:      'Pago',
  OVERDUE:   'Em atraso',
  CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  PENDING:   '#42a5f5',
  PAID:      '#c8f542',
  OVERDUE:   '#ff3b3b',
  CANCELLED: '#444455',
};

const today = () => new Date().toISOString().split('T')[0];

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<InvoiceStatus | 'ALL'>('ALL');

  // form state
  const [form, setForm] = useState({
    clientId: '', amount: '', currency: 'EUR', description: '', dueDate: today(), notes: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    invoicesApi.getAll()
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: InvoiceStatus) => {
    await invoicesApi.update(id, { status });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminar esta factura?')) return;
    await invoicesApi.delete(id);
    load();
  };

  const visible = filter === 'ALL' ? invoices : invoices.filter((i) => i.status === filter);

  const totals = {
    pending: invoices.filter((i) => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0),
    paid:    invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0),
  };

  return (
    <Page>
      <Header>
        <div>
          <Title>Facturação</Title>
          <Subtitle>// {invoices.length} factura{invoices.length !== 1 ? 's' : ''}</Subtitle>
        </div>
        <NewBtn onClick={() => setShowForm(!showForm)}>+ Nova factura</NewBtn>
      </Header>

      {/* KPIs */}
      <KpiRow>
        {[
          { label: 'Pendente', val: totals.pending, color: '#42a5f5' },
          { label: 'Recebido', val: totals.paid,    color: '#c8f542' },
          { label: 'Em atraso', val: totals.overdue, color: '#ff3b3b' },
        ].map(({ label, val, color }) => (
          <KpiCard key={label} $color={color}>
            <KpiVal $color={color}>{val.toFixed(2)} €</KpiVal>
            <KpiLabel>{label}</KpiLabel>
          </KpiCard>
        ))}
      </KpiRow>

      {/* Create form */}
      {showForm && (
        <FormCard onSubmit={handleCreate}>
          <FormTitle>Nova factura</FormTitle>
          <FormGrid>
            <FormField>
              <Label>ID do cliente</Label>
              <Input
                placeholder="client_id"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                required
              />
            </FormField>
            <FormField>
              <Label>Valor (€)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="50.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </FormField>
            <FormField>
              <Label>Descrição</Label>
              <Input
                placeholder="Mensalidade Janeiro"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </FormField>
            <FormField>
              <Label>Data limite</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </FormField>
            <FormField style={{ gridColumn: '1 / -1' }}>
              <Label>Notas (opcional)</Label>
              <Input
                placeholder="Inclui 4 sessões"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </FormField>
          </FormGrid>
          <FormActions>
            <CancelBtn type="button" onClick={() => setShowForm(false)}>Cancelar</CancelBtn>
            <SaveBtn type="submit" disabled={saving}>{saving ? 'A criar...' : 'Criar factura'}</SaveBtn>
          </FormActions>
        </FormCard>
      )}

      {/* Filters */}
      <FilterRow>
        {(['ALL', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map((f) => (
          <FilterBtn key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f === 'ALL' ? 'Todas' : STATUS_LABEL[f]}
          </FilterBtn>
        ))}
      </FilterRow>

      {/* Table */}
      {loading ? (
        <Empty>A carregar...</Empty>
      ) : visible.length === 0 ? (
        <Empty>Sem facturas.</Empty>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Descrição</Th>
              <Th center>Valor</Th>
              <Th center>Vencimento</Th>
              <Th center>Estado</Th>
              <Th center>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map((inv) => (
              <Tr key={inv.id}>
                <Td>{inv.client?.name ?? inv.clientId.slice(0, 8)}</Td>
                <Td>{inv.description}</Td>
                <Td center><Amount>{inv.amount.toFixed(2)} {inv.currency}</Amount></Td>
                <Td center>
                  <DateCell $overdue={inv.status === 'OVERDUE'}>
                    {new Date(inv.dueDate).toLocaleDateString('pt-PT')}
                  </DateCell>
                </Td>
                <Td center>
                  <StatusBadge $color={STATUS_COLOR[inv.status]}>
                    {STATUS_LABEL[inv.status]}
                  </StatusBadge>
                </Td>
                <Td center>
                  <ActionRow>
                    {inv.status !== 'PAID' && (
                      <ActionBtn $color="#c8f542" onClick={() => handleStatus(inv.id, 'PAID')}>
                        ✓ Pago
                      </ActionBtn>
                    )}
                    {inv.status === 'PAID' && (
                      <ActionBtn $color="#42a5f5" onClick={() => handleStatus(inv.id, 'PENDING')}>
                        ↩ Reverter
                      </ActionBtn>
                    )}
                    <ActionBtn $color="#ff3b3b" onClick={() => handleDelete(inv.id)}>
                      ✕
                    </ActionBtn>
                  </ActionRow>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </Page>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

const Page = styled.div`
  padding: 40px 32px;
  max-width: 1100px;
  animation: ${fadeIn} 0.25s ease;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
`;

const Title = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 800;
  color: #e8e8f0;
`;

const Subtitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  margin-top: 4px;
`;

const NewBtn = styled.button`
  background: #c8f542;
  border: none;
  border-radius: 7px;
  padding: 10px 18px;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #0a0a0f;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #d4ff55; }
`;

const KpiRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
`;

const KpiCard = styled.div<{ $color: string }>`
  background: #111118;
  border: 1px solid #1e1e28;
  border-top: 2px solid ${({ $color }) => $color};
  border-radius: 10px;
  padding: 18px 20px;
`;

const KpiVal = styled.div<{ $color: string }>`
  font-family: 'Syne', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: ${({ $color }) => $color};
`;

const KpiLabel = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  margin-top: 4px;
`;

const FormCard = styled.form`
  background: #111118;
  border: 1px solid #2a2a35;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
`;

const FormTitle = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 16px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const FormField = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const Label = styled.label`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #666677;
  letter-spacing: 1px;
`;

const Input = styled.input`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 8px 12px;
  color: #e8e8f0;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  outline: none;
  &:focus { border-color: #c8f542; }
  &::placeholder { color: #333342; }
`;

const FormActions = styled.div`display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;`;

const CancelBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  border-radius: 6px;
  padding: 8px 18px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  &:hover { border-color: #666677; color: #e8e8f0; }
`;

const SaveBtn = styled.button`
  background: #c8f542;
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #0a0a0f;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #d4ff55; }
`;

const FilterRow = styled.div`display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;`;

const FilterBtn = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? 'rgba(200,245,66,0.12)' : 'transparent')};
  border: 1px solid ${({ $active }) => ($active ? '#c8f542' : '#2a2a35')};
  color: ${({ $active }) => ($active ? '#c8f542' : '#666677')};
  border-radius: 5px;
  padding: 5px 12px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #c8f542; color: #c8f542; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #111118;
  border: 1px solid #1e1e28;
  border-radius: 10px;
  overflow: hidden;
`;

const Th = styled.th<{ center?: boolean }>`
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  letter-spacing: 2px;
  color: #444455;
  text-transform: uppercase;
  padding: 12px 16px;
  text-align: ${({ center }) => (center ? 'center' : 'left')};
  font-weight: 400;
  border-bottom: 1px solid #1e1e28;
  background: #0d0d13;
`;

const Tr = styled.tr`border-bottom: 1px solid #1a1a22; &:last-child { border-bottom: none; }`;

const Td = styled.td<{ center?: boolean }>`
  padding: 12px 16px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #888899;
  text-align: ${({ center }) => (center ? 'center' : 'left')};
  vertical-align: middle;
`;

const Amount = styled.span`
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  color: #e8e8f0;
  font-size: 13px;
`;

const DateCell = styled.span<{ $overdue: boolean }>`
  color: ${({ $overdue }) => ($overdue ? '#ff3b3b' : '#888899')};
`;

const StatusBadge = styled.span<{ $color: string }>`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 3px;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}18;
  border: 1px solid ${({ $color }) => $color}44;
`;

const ActionRow = styled.div`display: flex; gap: 6px; justify-content: center;`;

const ActionBtn = styled.button<{ $color: string }>`
  background: transparent;
  border: 1px solid ${({ $color }) => $color}44;
  color: ${({ $color }) => $color};
  border-radius: 5px;
  padding: 4px 10px;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover { background: ${({ $color }) => $color}18; border-color: ${({ $color }) => $color}; }
`;

const Empty = styled.div`
  padding: 40px;
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #444455;
`;
