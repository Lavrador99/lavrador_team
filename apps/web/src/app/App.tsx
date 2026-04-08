import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { refreshSession } from './store/slices/authSlice';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ExercisesPage } from './pages/exercises/ExercisesPage';
import { PrescriptionPage } from './pages/prescription/PrescriptionPage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ClientDetailPage } from './pages/clients/ClientDetailPage';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { NewUserPage } from './pages/users-new/NewUserPage';
import { WorkoutsListPage } from './pages/workouts/WorkoutsListPage';
import { WorkoutEditorPage } from './pages/workouts/WorkoutEditorPage';
import { MyPlanPage } from './pages/my-plan/MyPlanPage';
import { WorkoutLoggerPage } from './pages/my-plan/WorkoutLoggerPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { HabitsPage } from './pages/habits/HabitsPage';
import { TemplatesPage } from './pages/templates/TemplatesPage';
import { MyNutritionPage } from './pages/my-nutrition/MyNutritionPage';
import { NutritionPage } from './pages/nutrition/NutritionPage';
import { InstallPwaPrompt } from './components/InstallPwaPrompt';

export const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(refreshSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Autenticado — qualquer role */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/my-plan" element={<MyPlanPage />} />
            <Route path="/my-plan/log/:workoutId" element={<WorkoutLoggerPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/my-nutrition" element={<MyNutritionPage />} />
          </Route>
        </Route>

        {/* Só ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route element={<AppLayout />}>
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:clientId" element={<ClientDetailPage />} />
            <Route path="/clients/new" element={<NewUserPage />} />
            <Route path="/prescription" element={<PrescriptionPage />} />
            <Route path="/workouts" element={<WorkoutsListPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
          </Route>
          {/* Editor fullscreen — sem sidebar */}
          <Route path="/workouts/editor" element={<WorkoutEditorPage />} />
          <Route path="/workouts/editor/:id" element={<WorkoutEditorPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <InstallPwaPrompt />
    </BrowserRouter>
  );
};
