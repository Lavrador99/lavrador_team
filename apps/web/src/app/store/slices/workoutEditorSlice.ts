import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WorkoutDto, WorkoutBlock, BlockExercise, BlockType } from '@libs/types';
import { workoutsApi } from '../../utils/api/workouts.api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _idCounter = 1;
const genId = () => `block_${Date.now()}_${_idCounter++}`;
const genExId = () => `ex_${Date.now()}_${_idCounter++}`;

export const DEFAULT_REST: Record<BlockType, { sets: number; block: number }> = {
  WARMUP:     { sets: 0,   block: 30  },
  SEQUENTIAL: { sets: 90,  block: 120 },
  SUPERSET:   { sets: 60,  block: 120 },
  CIRCUIT:    { sets: 30,  block: 90  },
  TABATA:     { sets: 0,   block: 60  },
  CARDIO:     { sets: 0,   block: 60  },
  FLEXIBILITY:{ sets: 5,   block: 30  },
};

export function makeDefaultBlock(type: BlockType): WorkoutBlock {
  const rests = DEFAULT_REST[type];
  const base: WorkoutBlock = {
    id: genId(),
    type,
    order: 0,
    restBetweenSets: rests.sets,
    restAfterBlock: rests.block,
    exercises: [],
  };

  if (type === 'TABATA') {
    base.tabata = { workSeconds: 20, restSeconds: 10, rounds: 8, totalSeconds: 240 };
    base.label = 'Tabata (20s trabalho / 10s repouso × 8 rounds)';
  }
  if (type === 'CARDIO') {
    base.cardioMethod = 'CONTINUO_EXTENSIVO';
    base.cardioDurationMin = 20;
    base.label = 'Cardio';
  }
  if (type === 'FLEXIBILITY') {
    base.stretchMethod = 'ESTATICO';
    base.holdSeconds = 20;
    base.label = 'Alongamentos';
  }
  if (type === 'WARMUP') {
    base.label = 'Aquecimento';
  }

  return base;
}

export function makeDefaultExercise(name = ''): BlockExercise {
  return {
    id: genExId(),
    exerciseId: null,
    exerciseName: name,
    sets: 3,
    reps: '10-12',
    restAfterSet: 90,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface WorkoutEditorState {
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
}

const initialState: WorkoutEditorState = {
  workout: null,
  blocks: [],
  name: 'Novo Treino',
  dayLabel: '',
  programId: '',
  clientId: '',
  isDirty: false,
  saving: false,
  durationPreview: null,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const saveWorkout = createAsyncThunk(
  'workoutEditor/save',
  async (_, { getState, rejectWithValue }) => {
    const state = (getState() as any).workoutEditor as WorkoutEditorState;
    try {
      if (state.workout?.id) {
        return await workoutsApi.update(state.workout.id, {
          name: state.name,
          dayLabel: state.dayLabel || undefined,
          blocks: state.blocks,
        });
      } else {
        return await workoutsApi.create({
          programId: state.programId,
          clientId: state.clientId,
          name: state.name,
          dayLabel: state.dayLabel || undefined,
          blocks: state.blocks,
        });
      }
    } catch (e: any) {
      return rejectWithValue(e.response?.data?.message ?? 'Erro ao guardar');
    }
  },
);

export const loadWorkout = createAsyncThunk(
  'workoutEditor/load',
  async (id: string) => workoutsApi.getById(id),
);

export const previewDuration = createAsyncThunk(
  'workoutEditor/preview',
  async (blocks: WorkoutBlock[]) => workoutsApi.previewDuration(blocks),
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const workoutEditorSlice = createSlice({
  name: 'workoutEditor',
  initialState,
  reducers: {
    initNew(state, action: PayloadAction<{ programId: string; clientId: string }>) {
      state.workout = null;
      state.blocks = [];
      state.name = 'Novo Treino';
      state.dayLabel = '';
      state.programId = action.payload.programId;
      state.clientId = action.payload.clientId;
      state.isDirty = false;
      state.error = null;
    },

    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
      state.isDirty = true;
    },

    setDayLabel(state, action: PayloadAction<string>) {
      state.dayLabel = action.payload;
      state.isDirty = true;
    },

    // ── Blocks ──────────────────────────────────────────────────────────

    addBlock(state, action: PayloadAction<BlockType>) {
      const block = makeDefaultBlock(action.payload);
      block.order = state.blocks.length;
      state.blocks.push(block);
      state.isDirty = true;
    },

    removeBlock(state, action: PayloadAction<string>) {
      state.blocks = state.blocks.filter((b) => b.id !== action.payload);
      state.blocks.forEach((b, i) => { b.order = i; });
      state.isDirty = true;
    },

    updateBlock(state, action: PayloadAction<{ id: string; changes: Partial<WorkoutBlock> }>) {
      const idx = state.blocks.findIndex((b) => b.id === action.payload.id);
      if (idx >= 0) {
        state.blocks[idx] = { ...state.blocks[idx], ...action.payload.changes };
        state.isDirty = true;
      }
    },

    // Drag-and-drop reorder
    reorderBlocks(state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) {
      const { fromIndex, toIndex } = action.payload;
      const [moved] = state.blocks.splice(fromIndex, 1);
      state.blocks.splice(toIndex, 0, moved);
      state.blocks.forEach((b, i) => { b.order = i; });
      state.isDirty = true;
    },

    // ── Exercises ────────────────────────────────────────────────────────

    addExercise(state, action: PayloadAction<{ blockId: string; exercise?: Partial<BlockExercise> }>) {
      const block = state.blocks.find((b) => b.id === action.payload.blockId);
      if (block) {
        const ex = { ...makeDefaultExercise(), ...action.payload.exercise };
        block.exercises.push(ex);
        state.isDirty = true;
      }
    },

    updateExercise(state, action: PayloadAction<{ blockId: string; exId: string; changes: Partial<BlockExercise> }>) {
      const block = state.blocks.find((b) => b.id === action.payload.blockId);
      if (block) {
        const idx = block.exercises.findIndex((e) => e.id === action.payload.exId);
        if (idx >= 0) {
          block.exercises[idx] = { ...block.exercises[idx], ...action.payload.changes };
          state.isDirty = true;
        }
      }
    },

    removeExercise(state, action: PayloadAction<{ blockId: string; exId: string }>) {
      const block = state.blocks.find((b) => b.id === action.payload.blockId);
      if (block) {
        block.exercises = block.exercises.filter((e) => e.id !== action.payload.exId);
        state.isDirty = true;
      }
    },

    reorderExercises(state, action: PayloadAction<{ blockId: string; fromIndex: number; toIndex: number }>) {
      const block = state.blocks.find((b) => b.id === action.payload.blockId);
      if (block) {
        const [moved] = block.exercises.splice(action.payload.fromIndex, 1);
        block.exercises.splice(action.payload.toIndex, 0, moved);
        state.isDirty = true;
      }
    },

    clearError(state) { state.error = null; },
  },

  extraReducers: (builder) => {
    builder
      .addCase(saveWorkout.pending, (state) => { state.saving = true; state.error = null; })
      .addCase(saveWorkout.fulfilled, (state, action) => {
        state.saving = false;
        state.isDirty = false;
        state.workout = action.payload;
      })
      .addCase(saveWorkout.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });

    builder.addCase(loadWorkout.fulfilled, (state, action) => {
      const w = action.payload;
      state.workout = w;
      state.blocks = (w.blocks as WorkoutBlock[]) ?? [];
      state.name = w.name;
      state.dayLabel = w.dayLabel ?? '';
      state.programId = w.programId;
      state.clientId = w.clientId;
      state.isDirty = false;
    });

    builder.addCase(previewDuration.fulfilled, (state, action) => {
      state.durationPreview = action.payload;
    });
  },
});

export const {
  initNew, setName, setDayLabel,
  addBlock, removeBlock, updateBlock, reorderBlocks,
  addExercise, updateExercise, removeExercise, reorderExercises,
  clearError,
} = workoutEditorSlice.actions;

export default workoutEditorSlice.reducer;
