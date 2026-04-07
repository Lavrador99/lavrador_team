import {
  AssessmentData,
  AssessmentDto,
  MovementPattern,
  ProgramDto,
} from "@libs/types";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { assessmentsApi, programsApi } from "../../utils/api/prescription.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseSelection {
  exerciseId: string;
  pattern: MovementPattern;
  type: "PREFERRED" | "REQUIRED";
  name: string;
}

interface PrescriptionState {
  // Wizard step
  currentStep: number;

  // Anamnese form data
  formData: Partial<AssessmentData>;

  // Exercise selections (passo 4)
  selections: ExerciseSelection[];

  // Results from API
  assessment: AssessmentDto | null;
  program: ProgramDto | null;

  // Target client
  clientId: string | null;

  // UI state
  loading: boolean;
  error: string | null;
}

const initialState: PrescriptionState = {
  currentStep: 0,
  formData: {},
  selections: [],
  assessment: null,
  program: null,
  clientId: null,
  loading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const saveAssessment = createAsyncThunk(
  "prescription/saveAssessment",
  async (
    payload: { clientId: string; data: AssessmentData },
    { rejectWithValue },
  ) => {
    try {
      return await assessmentsApi.create({
        clientId: payload.clientId,
        data: payload.data,
      });
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message ?? "Erro ao guardar avaliação",
      );
    }
  },
);

export const generateProgram = createAsyncThunk(
  "prescription/generateProgram",
  async (
    payload: {
      assessmentId: string;
      clientId: string;
      selections: ExerciseSelection[];
    },
    { rejectWithValue },
  ) => {
    try {
      return await programsApi.generate({
        assessmentId: payload.assessmentId,
        clientId: payload.clientId,
        selectedExercises: payload.selections.map((s) => ({
          exerciseId: s.exerciseId,
          pattern: s.pattern,
          type: s.type,
        })),
      });
    } catch (e: any) {
      return rejectWithValue(
        e.response?.data?.message ?? "Erro ao gerar plano",
      );
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const prescriptionSlice = createSlice({
  name: "prescription",
  initialState,
  reducers: {
    setStep(state, action: PayloadAction<number>) {
      state.currentStep = action.payload;
    },
    nextStep(state) {
      state.currentStep += 1;
    },
    prevStep(state) {
      state.currentStep = Math.max(0, state.currentStep - 1);
    },
    setClientId(state, action: PayloadAction<string>) {
      state.clientId = action.payload;
    },
    updateFormData(state, action: PayloadAction<Partial<AssessmentData>>) {
      state.formData = { ...state.formData, ...action.payload };
    },
    addSelection(state, action: PayloadAction<ExerciseSelection>) {
      // Remove se já existia o mesmo padrão com PREFERRED (substitui)
      const existing = state.selections.findIndex(
        (s) =>
          s.pattern === action.payload.pattern &&
          s.type === action.payload.type,
      );
      if (existing >= 0) {
        state.selections[existing] = action.payload;
      } else {
        state.selections.push(action.payload);
      }
    },
    removeSelection(state, action: PayloadAction<string>) {
      state.selections = state.selections.filter(
        (s) => s.exerciseId !== action.payload,
      );
    },
    replaceSelection(
      state,
      action: PayloadAction<{ oldId: string; newSelection: ExerciseSelection }>,
    ) {
      const idx = state.selections.findIndex(
        (s) => s.exerciseId === action.payload.oldId,
      );
      if (idx >= 0) {
        state.selections[idx] = action.payload.newSelection;
      }
    },
    clearError(state) {
      state.error = null;
    },
    resetPrescription() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // saveAssessment
    builder
      .addCase(saveAssessment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveAssessment.fulfilled, (state, action) => {
        state.loading = false;
        state.assessment = action.payload;
        state.currentStep += 1;
      })
      .addCase(saveAssessment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // generateProgram
    builder
      .addCase(generateProgram.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateProgram.fulfilled, (state, action) => {
        state.loading = false;
        state.program = action.payload;
        state.currentStep += 1;
      })
      .addCase(generateProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setStep,
  nextStep,
  prevStep,
  setClientId,
  updateFormData,
  addSelection,
  removeSelection,
  replaceSelection,
  clearError,
  resetPrescription,
} = prescriptionSlice.actions;

export default prescriptionSlice.reducer;
