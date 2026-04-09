import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { refreshSession } from './store/slices/authSlice';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';
import styled, { keyframes } from 'styled-components';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

const DashboardPage       = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ExercisesPage       = lazy(() => import('./pages/exercises/ExercisesPage').then(m => ({ default: m.ExercisesPage })));
const PrescriptionPage    = lazy(() => import('./pages/prescription/PrescriptionPage').then(m => ({ default: m.PrescriptionPage })));
const ClientsPage         = lazy(() => import('./pages/clients/ClientsPage').then(m => ({ default: m.ClientsPage })));
const ClientDetailPage    = lazy(() => import('./pages/clients/ClientDetailPage').then(m => ({ default: m.ClientDetailPage })));
const SchedulePage        = lazy(() => import('./pages/schedule/SchedulePage').then(m => ({ default: m.SchedulePage })));
const NewUserPage         = lazy(() => import('./pages/users-new/NewUserPage').then(m => ({ default: m.NewUserPage })));
const WorkoutsListPage    = lazy(() => import('./pages/workouts/WorkoutsListPage').then(m => ({ default: m.WorkoutsListPage })));
const WorkoutEditorPage   = lazy(() => import('./pages/workouts/WorkoutEditorPage').then(m => ({ default: m.WorkoutEditorPage })));
const MyPlanPage          = lazy(() => import('./pages/my-plan/MyPlanPage').then(m => ({ default: m.MyPlanPage })));
const WorkoutLoggerPage   = lazy(() => import('./pages/my-plan/WorkoutLoggerPage').then(m => ({ default: m.WorkoutLoggerPage })));
const MessagesPage        = lazy(() => import('./pages/messages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const InvoicesPage        = lazy(() => import('./pages/invoices/InvoicesPage').then(m => ({ default: m.InvoicesPage })));
const HabitsPage          = lazy(() => import('./pages/habits/HabitsPage').then(m => ({ default: m.HabitsPage })));
const TemplatesPage       = lazy(() => import('./pages/templates/TemplatesPage').then(m => ({ default: m.TemplatesPage })));
const MyNutritionPage     = lazy(() => import('./pages/my-nutrition/MyNutritionPage').then(m => ({ default: m.MyNutritionPage })));
const NutritionPage       = lazy(() => import('./pages/nutrition/NutritionPage').then(m => ({ default: m.NutritionPage })));
const CalendarPage        = lazy(() => import('./pages/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })));
const ExerciseHistoryPage = lazy(() => import('./pages/exercise-history/ExerciseHistoryPage').then(m => ({ default: m.ExerciseHistoryPage })));
const MuscleVolumePage    = lazy(() => import('./pages/muscle-volume/MuscleVolumePage').then(m => ({ default: m.MuscleVolumePage })));
const MyRecordsPage       = lazy(() => import('./pages/my-records/MyRecordsPage').then(m => ({ default: m.MyRecordsPage })));
const BodyMeasurementsPage = lazy(() => import('./pages/body-measurements/BodyMeasurementsPage').then(m => ({ default: m.BodyMeasurementsPage })));

// ─── Loading fallback ─────────────────────────────────────────────────────────

const PageLoader: React.FC = () => (
  <LoaderWrap>
    <LoaderDot />
  </LoaderWrap>
);

export const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(refreshSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Autenticado — qualquer role */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"                          element={<DashboardPage />} />
              <Route path="/schedule"                           element={<SchedulePage />} />
              <Route path="/exercises"                          element={<ExercisesPage />} />
              <Route path="/my-plan"                            element={<MyPlanPage />} />
              <Route path="/my-plan/log/:workoutId"             element={<WorkoutLoggerPage />} />
              <Route path="/messages"                           element={<MessagesPage />} />
              <Route path="/habits"                             element={<HabitsPage />} />
              <Route path="/my-nutrition"                       element={<MyNutritionPage />} />
              <Route path="/calendar"                           element={<CalendarPage />} />
              <Route path="/muscle-volume"                      element={<MuscleVolumePage />} />
              <Route path="/my-records"                         element={<MyRecordsPage />} />
              <Route path="/body-measurements"                  element={<BodyMeasurementsPage />} />
              <Route path="/exercise-history/:exerciseId"       element={<ExerciseHistoryPage />} />
            </Route>
          </Route>

          {/* Só ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AppLayout />}>
              <Route path="/clients"              element={<ClientsPage />} />
              <Route path="/clients/:clientId"    element={<ClientDetailPage />} />
              <Route path="/clients/new"          element={<NewUserPage />} />
              <Route path="/prescription"         element={<PrescriptionPage />} />
              <Route path="/workouts"             element={<WorkoutsListPage />} />
              <Route path="/invoices"             element={<InvoicesPage />} />
              <Route path="/templates"            element={<TemplatesPage />} />
              <Route path="/nutrition"            element={<NutritionPage />} />
            </Route>
            {/* Editor fullscreen — sem sidebar */}
            <Route path="/workouts/editor"      element={<WorkoutEditorPage />} />
            <Route path="/workouts/editor/:id"  element={<WorkoutEditorPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <InstallPwaPrompt />
    </BrowserRouter>
  );
};

// ─── Styled ───────────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50%       { opacity: 1;   transform: scale(1.2); }
`;

const LoaderWrap = styled.div`
  min-height: 100vh;
  background: #0a0a0f;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoaderDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #c8f542;
  animation: ${pulse} 1s ease-in-out infinite;
`;
