'use client';
import { create } from 'zustand';
import { WorkoutDto, WorkoutBlock, BlockExercise, BlockType } from '@libs/types';

let _counter = 1;
const genId = () => `block_${Date.now()}_${_counter++}`;
const genExId = () => `ex_${Date.now()}_${_counter++}`;

export const DEFAULT_REST: Record<BlockType, { sets: number; block: number }> = {
  WARMUP:      { sets: 0,   block: 30  },
  SEQUENTIAL:  { sets: 90,  block: 120 },
  SUPERSET:    { sets: 60,  block: 120 },
  CIRCUIT:     { sets: 30,  block: 90  },
  TABATA:      { sets: 0,   block: 60  },
  CARDIO:      { sets: 0,   block: 60  },
  FLEXIBILITY: { sets: 5,   block: 30  },
};

export function makeDefaultBlock(type: BlockType): WorkoutBlock {
  const rests = DEFAULT_REST[type];
  const base: WorkoutBlock = {
    id: genId(), type, order: 0,
    restBetweenSets: rests.sets, restAfterBlock: rests.block, exercises: [],
  };
  if (type === 'TABATA') { base.tabata = { workSeconds: 20, restSeconds: 10, rounds: 8, totalSeconds: 240 }; base.label = 'Tabata (20s / 10s × 8)'; }
  if (type === 'CARDIO') { base.cardioMethod = 'CONTINUO_EXTENSIVO'; base.cardioDurationMin = 20; base.label = 'Cardio'; }
  if (type === 'FLEXIBILITY') { base.stretchMethod = 'ESTATICO'; base.holdSeconds = 20; base.label = 'Alongamentos'; }
  if (type === 'WARMUP') { base.label = 'Aquecimento'; }
  return base;
}

export function makeDefaultExercise(name = ''): BlockExercise {
  return { id: genExId(), exerciseId: null, exerciseName: name, sets: 3, reps: '10-12', restAfterSet: 90 };
}

interface EditorState {
  workout: WorkoutDto | null;
  blocks: WorkoutBlock[];
  name: string;
  dayLabel: string;
  programId: string;
  clientId: string;
  isDirty: boolean;
  saving: boolean;
  durationPreview: { totalMin: number; warning?: string } | null;
  error: string | null;

  initNew: (opts: { programId: string; clientId: string }) => void;
  loadWorkout: (w: WorkoutDto) => void;
  setName: (n: string) => void;
  setDayLabel: (l: string) => void;
  addBlock: (type: BlockType) => void;
  removeBlock: (id: string) => void;
  updateBlock: (id: string, changes: Partial<WorkoutBlock>) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  addExercise: (blockId: string, exercise?: Partial<BlockExercise>) => void;
  removeExercise: (blockId: string, exId: string) => void;
  updateExercise: (blockId: string, exId: string, changes: Partial<BlockExercise>) => void;
  setDurationPreview: (p: { totalMin: number; warning?: string } | null) => void;
  setSaving: (v: boolean) => void;
  setError: (e: string | null) => void;
  setWorkout: (w: WorkoutDto) => void;
  markClean: () => void;
}

export const useWorkoutEditorStore = create<EditorState>((set, get) => ({
  workout: null, blocks: [], name: 'Novo Treino', dayLabel: '',
  programId: '', clientId: '', isDirty: false, saving: false,
  durationPreview: null, error: null,

  initNew: ({ programId, clientId }) =>
    set({ workout: null, blocks: [], name: 'Novo Treino', dayLabel: '', programId, clientId, isDirty: false, error: null }),

  loadWorkout: (w) =>
    set({ workout: w, blocks: w.blocks ?? [], name: w.name, dayLabel: w.dayLabel ?? '', programId: w.programId ?? '', clientId: '', isDirty: false, error: null }),

  setName: (n) => set({ name: n, isDirty: true }),
  setDayLabel: (l) => set({ dayLabel: l, isDirty: true }),

  addBlock: (type) => {
    const block = makeDefaultBlock(type);
    block.order = get().blocks.length;
    set((s) => ({ blocks: [...s.blocks, block], isDirty: true }));
  },

  removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id), isDirty: true })),

  updateBlock: (id, changes) =>
    set((s) => ({ blocks: s.blocks.map((b) => b.id === id ? { ...b, ...changes } : b), isDirty: true })),

  reorderBlocks: (fromIndex, toIndex) =>
    set((s) => {
      const arr = [...s.blocks];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return { blocks: arr.map((b, i) => ({ ...b, order: i })), isDirty: true };
    }),

  addExercise: (blockId, exercise = {}) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? { ...b, exercises: [...b.exercises, { ...makeDefaultExercise(), ...exercise }] }
          : b,
      ),
      isDirty: true,
    })),

  removeExercise: (blockId, exId) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId ? { ...b, exercises: b.exercises.filter((e) => e.id !== exId) } : b,
      ),
      isDirty: true,
    })),

  updateExercise: (blockId, exId, changes) =>
    set((s) => ({
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? { ...b, exercises: b.exercises.map((e) => e.id === exId ? { ...e, ...changes } : e) }
          : b,
      ),
      isDirty: true,
    })),

  setDurationPreview: (p) => set({ durationPreview: p }),
  setSaving: (v) => set({ saving: v }),
  setError: (e) => set({ error: e }),
  setWorkout: (w) => set({ workout: w }),
  markClean: () => set({ isDirty: false }),
}));
