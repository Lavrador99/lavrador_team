import { ReactNode } from 'react';

interface DarkCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: 'div' | 'button';
}

export function DarkCard({ children, className = '', onClick, as: Tag = 'div' }: DarkCardProps) {
  const base = 'bg-zinc-900 rounded-2xl border border-zinc-800/60';
  if (Tag === 'button') {
    return (
      <button
        onClick={onClick}
        className={`${base} w-full text-left active:scale-[0.99] transition-transform ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}
