interface KpiCardProps {
  value: string | number;
  label: string;
  icon: string;
  accent?: string;
  sub?: string;
}

export function KpiCard({ value, label, icon, accent = 'border-primary', sub }: KpiCardProps) {
  return (
    <div className={`bg-surface-container-lowest rounded-2xl p-6 shadow-sm overflow-hidden border-t-2 ${accent}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="material-symbols-outlined text-outline text-2xl">{icon}</span>
        {sub && (
          <span className="label-category text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-lg">{sub}</span>
        )}
      </div>
      <div className="font-headline font-black text-4xl text-on-surface leading-none">{value}</div>
      <div className="label-category mt-2">{label}</div>
    </div>
  );
}
