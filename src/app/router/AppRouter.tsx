import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/app/layouts/AppShell';
import { Skeleton } from '@/components/ui/Primitives';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const SchedulePage = lazy(() => import('@/features/schedule/SchedulePage'));
const TasksPage = lazy(() => import('@/features/tasks/TasksPage'));
const LearningHubPage = lazy(() => import('@/features/learning/LearningHubPage'));
const CareerPage = lazy(() => import('@/features/career/CareerPage'));
const ProjectsPage = lazy(() => import('@/features/projects/ProjectsPage'));
const AnalyticsPage = lazy(() => import('@/features/analytics/AnalyticsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

function RouteSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/schedule"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <SchedulePage />
              </Suspense>
            }
          />
          <Route
            path="/tasks"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <TasksPage />
              </Suspense>
            }
          />
          <Route
            path="/learning"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <LearningHubPage />
              </Suspense>
            }
          />
          <Route
            path="/career"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <CareerPage />
              </Suspense>
            }
          />
          <Route
            path="/projects"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <ProjectsPage />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<RouteSkeleton />}>
                <SettingsPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
