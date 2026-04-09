'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CLIENT_TABS = [
  { path: '/client/dashboard',  label: 'Início',     icon: '⬡' },
  { path: '/client/my-plan',    label: 'Plano',      icon: '▦' },
  { path: '/client/exercises',  label: 'Exercícios', icon: '◈' },
  { path: '/client/stats',      label: 'Dados',      icon: '◉' },
  { path: '/client/messages',   label: 'Chat',       icon: '◷' },
];

export function ClientTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-panel border-t border-border z-50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {CLIENT_TABS.map((tab) => {
          const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/');
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-muted'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={`font-mono text-[8px] tracking-widest uppercase ${isActive ? 'text-accent' : 'text-faint'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
