import { WorkoutEditorClient } from '../WorkoutEditorClient';

export default function EditWorkoutEditorPage({ params }: { params: { id: string } }) {
  return <WorkoutEditorClient workoutId={params.id} />;
}
