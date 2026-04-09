'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/authStore';

// Redirect hub after login — resolves role without decoding JWT in middleware
export default function EntryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (user.role === 'ADMIN') {
      router.replace('/dashboard');
    } else {
      router.replace('/client/dashboard');
    }
  }, [user, router]);

  return (
    <main className="min-h-screen bg-dark flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
    </main>
  );
}
