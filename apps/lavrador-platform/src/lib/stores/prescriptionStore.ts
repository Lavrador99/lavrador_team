'use client';
import { create } from 'zustand';
import { AssessmentData, AssessmentDto, MovementPattern, ProgramDto } from '@libs/types';

export interface ExerciseSelection {
  exerciseId: string;
  pattern: MovementPattern;
  type: 'PREFERRED' | 'REQUIRED';
  name: string;
}

interface PrescriptionState {
  currentStep: number;
  formData: Partial<AssessmentData>;
  selections: ExerciseSelection[];
  assessment: AssessmentDto | null;
  program: ProgramDto | null;
  clientId: string | null;
  loading: boolean;
  error: string | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setClientId: (id: string) => void;
  updateFormData: (data: Partial<AssessmentData>) => void;
  addSelection: (sel: ExerciseSelection) => void;
  replaceSelection: (oldId: string, newSel: ExerciseSelection) => void;
  removeSelection: (id: string) => void;
  setAssessment: (a: AssessmentDto) => void;
  setProgram: (p: ProgramDto) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

const initial = {
  currentStep: 0,
  formData: {} as Partial<AssessmentData>,
  selections: [] as ExerciseSelection[],
  assessment: null,
  program: null,
  clientId: null,
  loading: false,
  error: null,
};

export const usePrescriptionStore = create<PrescriptionState>((set) => ({
  ...initial,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  setClientId: (id) => set({ clientId: id }),
  updateFormData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),

  addSelection: (sel) =>
    set((s) => {
      const existing = s.selections.findIndex(
        (x) => x.pattern === sel.pattern && x.type === sel.type,
      );
      if (existing >= 0) {
        const arr = [...s.selections];
        arr[existing] = sel;
        return { selections: arr };
      }
      return { selections: [...s.selections, sel] };
    }),

  replaceSelection: (oldId, newSel) =>
    set((s) => {
      const idx = s.selections.findIndex((x) => x.exerciseId === oldId);
      if (idx < 0) return {};
      const arr = [...s.selections];
      arr[idx] = newSel;
      return { selections: arr };
    }),

  removeSelection: (id) =>
    set((s) => ({ selections: s.selections.filter((x) => x.exerciseId !== id) })),

  setAssessment: (a) => set({ assessment: a }),
  setProgram: (p) => set({ program: p }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),
  reset: () => set(initial),
}));
