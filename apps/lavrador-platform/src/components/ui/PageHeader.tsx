import { ReactNode } from 'react';

interface PageHeaderProps {
  label: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Extra className on the outer wrapper */
  className?: string;
}

export function PageHeader({ label, title, subtitle, action, className = 'mb-8' }: PageHeaderProps) {
  return (
    <div className={`flex items-end justify-between ${className}`}>
      <div>
        <span className="label-category text-primary">{label}</span>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-sm text-secondary mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
}
