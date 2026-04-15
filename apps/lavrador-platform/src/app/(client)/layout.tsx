import { ClientTabBar } from '../../components/layout/ClientTabBar';
import { PendingLogsFlusher } from '../../components/PendingLogsFlusher';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--client-bg)', color: 'var(--client-text)' }}>
      <PendingLogsFlusher />
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {children}
      </main>
      <ClientTabBar />
    </div>
  );
}
