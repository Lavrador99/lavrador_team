import { ReactNode } from 'react';

interface DarkPageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function DarkPageHeader({ eyebrow, title, subtitle, action, className = 'mb-6' }: DarkPageHeaderProps) {
  return (
    <div className={`flex items-start justify-between ${className}`}>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600 mb-1">{eyebrow}</div>
        <h1 className="font-[Manrope] font-black text-2xl text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
