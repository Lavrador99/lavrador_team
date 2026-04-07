import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import prescriptionReducer from './slices/prescriptionSlice';
import scheduleReducer from './slices/scheduleSlice';
import workoutEditorReducer from './slices/workoutEditorSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    prescription: prescriptionReducer,
    schedule: scheduleReducer,
    workoutEditor: workoutEditorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
