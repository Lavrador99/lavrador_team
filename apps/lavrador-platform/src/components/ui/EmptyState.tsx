import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  action?: ReactNode;
  /** 'page' fills vertical space; 'section' is compact */
  size?: 'page' | 'section';
}

export function EmptyState({ icon = 'inbox', title, action, size = 'page' }: EmptyStateProps) {
  const py = size === 'page' ? 'py-20' : 'py-10';
  return (
    <div className={`${py} text-center`}>
      <span className="material-symbols-outlined text-3xl text-outline mb-2 block">{icon}</span>
      <p className="text-sm text-secondary">{title}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

/** Inline loading skeleton used while SWR is fetching */
export function LoadingState({ message = 'A carregar...' }: { message?: string }) {
  return <div className="py-20 text-sm text-secondary text-center">{message}</div>;
}
