import { Suspense } from 'react';
import { PrescriptionPageClient } from './PrescriptionPageClient';

export default function PrescriptionPage() {
  return (
    <Suspense fallback={<div className="py-20 font-mono text-sm text-muted text-center">A carregar...</div>}>
      <PrescriptionPageClient />
    </Suspense>
  );
}
