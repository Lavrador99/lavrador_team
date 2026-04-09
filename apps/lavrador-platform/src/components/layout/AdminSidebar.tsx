'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../../lib/stores/authStore';
import { authApi } from '../../lib/api/auth.api';

const ADMIN_NAV = [
  { path: '/dashboard',    label: 'Dashboard',   icon: '⬡' },
  { path: '/clients',      label: 'Clientes',     icon: '◎' },
  { path: '/schedule',     label: 'Agenda',       icon: '◫' },
  { path: '/prescription', label: 'Prescrição',   icon: '⚡' },
  { path: '/exercises',    label: 'Exercícios',   icon: '◈' },
  { path: '/templates',    label: 'Templates',    icon: '◰' },
  { path: '/nutrition',    label: 'Nutrição',     icon: '◍' },
  { path: '/messages',     label: 'Mensagens',    icon: '◷' },
  { path: '/invoices',     label: 'Facturação',   icon: '◈' },
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
      className={`flex flex-col bg-panel border-r border-border transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-56'
      } min-h-screen flex-shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="font-syne font-black text-dark text-xs">LT</span>
        </div>
        {!collapsed && (
          <span className="font-syne font-black text-sm text-white leading-tight">
            Lavrador<br />Team
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted hover:text-white transition-colors text-xs"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors mb-0.5 ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="font-sans text-sm font-medium truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-colors`}
        >
          <span className="text-base flex-shrink-0">↩</span>
          {!collapsed && <span className="font-sans text-sm">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
