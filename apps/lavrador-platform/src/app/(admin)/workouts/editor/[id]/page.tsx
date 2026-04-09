'use client';
import { useParams } from 'next/navigation';
import { WorkoutEditorClient } from '../WorkoutEditorClient';

export default function EditWorkoutEditorPage() {
  const { id } = useParams<{ id: string }>();
  return <WorkoutEditorClient workoutId={id} />;
}
