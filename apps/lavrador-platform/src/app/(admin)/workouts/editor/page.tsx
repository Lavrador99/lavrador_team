import { Suspense } from 'react';
import { WorkoutEditorClient } from './WorkoutEditorClient';

export default function NewWorkoutEditorPage() {
  return (
    <Suspense fallback={<div className="py-20 font-mono text-sm text-muted text-center">A carregar editor...</div>}>
      <WorkoutEditorClient />
    </Suspense>
  );
}
