'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CLIENT_TABS = [
  { path: '/client/dashboard',  label: 'Início',    icon: 'home' },
  { path: '/client/my-plan',    label: 'Treino',    icon: 'fitness_center' },
  { path: '/client/stats',      label: 'Dados',     icon: 'insights' },
  { path: '/client/messages',   label: 'Coach',     icon: 'forum' },
  { path: '/client/profile',    label: 'Perfil',    icon: 'person' },
];

export function ClientTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t"
      style={{ background: 'var(--client-tab-bg)', borderColor: 'var(--client-tab-border)' }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-6 max-w-lg mx-auto">
        {CLIENT_TABS.map((tab) => {
          const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/');
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className="flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all duration-150 gap-0.5"
            >
              <span
                className="material-symbols-outlined text-[22px] transition-colors"
                style={{
                  color: isActive ? 'var(--client-accent)' : 'var(--client-text-muted)',
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {tab.icon}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.06em] transition-colors"
                style={{ color: isActive ? 'var(--client-accent)' : 'var(--client-text-muted)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
