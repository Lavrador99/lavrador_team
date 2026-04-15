import { ReactNode } from 'react';

export function SectionTitle({ children, className = 'mb-4' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-headline font-bold text-base text-on-surface ${className}`}>{children}</h2>
  );
}
