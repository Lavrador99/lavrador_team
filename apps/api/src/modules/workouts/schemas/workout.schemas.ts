import { z } from 'zod';

// ─── BlockExercise ──────────────────────────────────────────────────────────

const blockExerciseSchema = z.object({
  id: z.string(),
  exerciseId: z.string().nullable(),
  exerciseName: z.string().min(1),
  muscleGroup: z.string().optional(),
  sets: z.number().int().min(1),
  reps: z.string(),
  load: z.number().optional(),
  loadNote: z.string().optional(),
  percentRM: z.number().min(0).max(100).optional(),
  rir: z.number().min(0).optional(),
  tempoExecution: z.string().optional(),
  isometricSeconds: z.number().optional(),
  restAfterSet: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// ─── WorkoutBlock ───────────────────────────────────────────────────────────

const tabataConfigSchema = z.object({
  workSeconds: z.number().int().min(1),
  restSeconds: z.number().int().min(0),
  rounds: z.number().int().min(1),
  totalSeconds: z.number().int().min(0),
});

const blockTypeSchema = z.enum([
  'WARMUP', 'SEQUENTIAL', 'SUPERSET', 'CIRCUIT', 'TABATA', 'CARDIO', 'FLEXIBILITY',
]);

export const workoutBlockSchema = z.object({
  id: z.string(),
  type: blockTypeSchema,
  order: z.number().int().min(0),
  label: z.string().optional(),
  restBetweenSets: z.number().min(0),
  restAfterBlock: z.number().min(0),
  tabata: tabataConfigSchema.optional(),
  cardioMethod: z.string().optional(),
  cardioDurationMin: z.number().optional(),
  cardioZoneLow: z.number().optional(),
  cardioZoneHigh: z.number().optional(),
  cardioNotes: z.string().optional(),
  stretchMethod: z.string().optional(),
  holdSeconds: z.number().optional(),
  contractionSeconds: z.number().optional(),
  exercises: z.array(blockExerciseSchema),
  estimatedDurationMin: z.number().optional(),
});

export const workoutBlocksSchema = z.array(workoutBlockSchema);

// ─── WorkoutLogEntry ────────────────────────────────────────────────────────

const setTypeSchema = z.enum(['NORMAL', 'WARMUP', 'DROP', 'FAILURE']);

const logSetSchema = z.object({
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0),
  load: z.number().optional(),
  rpe: z.number().min(0).max(10).optional(),
  completed: z.boolean(),
  setType: setTypeSchema.optional(),
  notes: z.string().optional(),
});

export const workoutLogEntrySchema = z.object({
  blockId: z.string(),
  exerciseId: z.string(),
  exerciseName: z.string().min(1),
  sets: z.array(logSetSchema),
});

export const workoutLogEntriesSchema = z.array(workoutLogEntrySchema);
