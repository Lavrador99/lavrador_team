import { AdminSidebar } from '../../components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-container-low">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 min-w-0">
        {children}
      </main>
    </div>
  );
}
