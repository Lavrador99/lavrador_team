import { ClientTabBar } from '../../components/layout/ClientTabBar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dark pb-20">
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {children}
      </main>
      <ClientTabBar />
    </div>
  );
}
