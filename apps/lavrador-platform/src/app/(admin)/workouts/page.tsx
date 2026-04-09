import { Suspense } from 'react';
import { WorkoutsPageClient } from './WorkoutsPageClient';

export default function WorkoutsPage() {
  return (
    <Suspense fallback={<div className="py-20 font-mono text-sm text-muted text-center">A carregar...</div>}>
      <WorkoutsPageClient />
    </Suspense>
  );
}
