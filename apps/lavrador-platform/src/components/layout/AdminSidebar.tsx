'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../lib/stores/authStore';
import { authApi } from '../../lib/api/auth.api';

const ADMIN_NAV = [
  { path: '/dashboard',    label: 'Dashboard',   icon: 'dashboard' },
  { path: '/clients',      label: 'Clientes',    icon: 'group' },
  { path: '/schedule',     label: 'Agenda',      icon: 'calendar_month' },
  { path: '/messages',     label: 'Mensagens',   icon: 'forum' },
  { path: '/prescription', label: 'Prescrição',  icon: 'description' },
  { path: '/exercises',    label: 'Exercícios',  icon: 'fitness_center' },
  { path: '/workouts',     label: 'Templates',   icon: 'folder_open' },
  { path: '/nutrition',    label: 'Nutrição',    icon: 'nutrition' },
  { path: '/invoices',     label: 'Facturação',  icon: 'payments' },
  { path: '/revenue',      label: 'Revenue',     icon: 'bar_chart' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    router.replace('/login');
  }

  return (
    <aside
      className={`flex flex-col bg-zinc-50 border-r-0 transition-all duration-200 flex-shrink-0 ${
        collapsed ? 'w-16' : 'w-56'
      } min-h-screen`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-6 ${collapsed ? 'justify-center' : ''}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="kinetic-gradient w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-ambient hover:opacity-90 transition-opacity"
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <span className="font-headline font-black text-white text-xs">LT</span>
        </button>
        {!collapsed && (
          <>
            <div className="flex flex-col min-w-0">
              <span className="font-headline font-black text-sm text-teal-900 tracking-tight leading-tight uppercase">
                Lavrador Team
              </span>
              <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-400 uppercase mt-0.5">
                Coach Portal
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="ml-auto text-zinc-400 hover:text-on-surface transition-colors p-1 rounded"
              aria-label="Colapsar sidebar"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto px-3 space-y-0.5">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-white shadow-sm text-teal-700 font-bold'
                  : 'text-zinc-500 hover:text-teal-700 hover:bg-white/70'
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl flex-shrink-0 transition-all ${
                  isActive ? 'text-primary' : 'text-zinc-400 group-hover:text-teal-600'
                }`}
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="font-headline text-sm tracking-wide uppercase truncate">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 pt-4 border-t border-zinc-100 space-y-1">
        {!collapsed && (
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-teal-700 hover:bg-white/70 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-zinc-400">settings</span>
            <span className="font-headline text-xs tracking-widest uppercase">Definições</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-zinc-400 hover:text-error hover:bg-error/5 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="material-symbols-outlined text-xl flex-shrink-0">logout</span>
          {!collapsed && (
            <span className="font-headline text-xs tracking-widest uppercase">Sair</span>
          )}
        </button>
      </div>
    </aside>
  );
}
