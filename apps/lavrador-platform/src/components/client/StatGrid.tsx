interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface StatGridProps {
  stats: StatItem[];
  cols?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ stats, cols = 3, className = 'mb-6' }: StatGridProps) {
  const gridCols = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[cols];
  return (
    <div className={`grid ${gridCols} gap-3 ${className}`}>
      {stats.map(({ label, value, color = 'text-white' }) => (
        <div key={label} className="bg-zinc-900 rounded-2xl px-3 py-4 border border-zinc-800/60 text-center">
          <div className={`font-[Manrope] font-black text-2xl ${color}`}>{value}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
