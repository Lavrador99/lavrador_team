'use client';
import useSWR from 'swr';
import { PageHeader } from '../../../components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((r) => r.json());

interface RevenueData {
  thisMonth:    { revenue: number; invoices: number };
  thisYear:     { revenue: number; invoices: number };
  pendingValue: number;
  overdueValue: number;
  overdueCount: number;
  monthlyChart: { month: string; revenue: number }[];
}

function RevenueBar({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 mb-4 shadow-sm">
      <p className="label-category mb-4">Receita mensal (€)</p>
      <div className="flex items-end gap-2 h-28">
        {data.map((d, i) => {
          const h = Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 0);
          const isLast = i === data.length - 1;
          return (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="font-label text-xs text-secondary">{d.revenue > 0 ? `€${Math.round(d.revenue)}` : ''}</span>
              <div
                className={`w-full rounded-t transition-all ${isLast ? 'kinetic-gradient' : 'bg-surface-container-high'}`}
                style={{ height: `${h}%`, minHeight: d.revenue > 0 ? 4 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1">
        {data.map((d, i) => (
          <div key={d.month} className={`flex-1 text-center font-label text-[9px] uppercase ${i === data.length - 1 ? 'text-primary font-bold' : 'text-outline'}`}>
            {d.month}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl p-4 shadow-sm ${warn ? 'border border-red-500/30' : ''}`}>
      <p className="label-category mb-1">{label}</p>
      <p className={`font-headline font-black text-2xl ${warn ? 'text-red-400' : 'text-on-surface'}`}>{value}</p>
      {sub && <p className="font-label text-xs text-secondary mt-0.5">{sub}</p>}
    </div>
  );
}

export default function RevenuePage() {
  const { data, isLoading } = useSWR<RevenueData>(`${API}/api/stats/revenue`, fetcher);

  const fmt = (v: number) =>
    v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <div>
      <PageHeader
        label="Finanças"
        title="Revenue"
        subtitle="Resumo de faturação e pagamentos"
      />

      {isLoading || !data ? (
        <div className="text-center py-16 text-secondary font-label text-sm">A carregar...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
              label="Este mês"
              value={fmt(data.thisMonth.revenue)}
              sub={`${data.thisMonth.invoices} faturas pagas`}
            />
            <StatCard
              label="Este ano"
              value={fmt(data.thisYear.revenue)}
              sub={`${data.thisYear.invoices} faturas pagas`}
            />
            <StatCard
              label="Pendente"
              value={fmt(data.pendingValue)}
              sub="Por cobrar"
            />
            <StatCard
              label="Em atraso"
              value={fmt(data.overdueValue)}
              sub={`${data.overdueCount} ${data.overdueCount === 1 ? 'fatura' : 'faturas'}`}
              warn={data.overdueCount > 0}
            />
          </div>

          <RevenueBar data={data.monthlyChart} />

          {data.overdueCount > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400 text-xl">warning</span>
              <div>
                <p className="font-headline font-bold text-sm text-on-surface">
                  {data.overdueCount} {data.overdueCount === 1 ? 'fatura vencida' : 'faturas vencidas'}
                </p>
                <p className="font-label text-xs text-secondary">
                  Total em atraso: {fmt(data.overdueValue)} — vai à secção de pagamentos de cada cliente
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
