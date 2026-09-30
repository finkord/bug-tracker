import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { useAuth, useSidebar } from './store';
import { SessionExpiredModal } from './components/common/SessionExpiredModal';
import { WorkspaceHeader } from './components/workspace/WorkspaceHeader';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';
import { ProtectedRoute, AdminRoute, PublicOnlyRoute } from './components/common/ProtectedRoute';
import { PageSkeletonLoader } from './components/common/PageSkeletonLoader';
import { Menu, Shield } from 'lucide-react';

const HomePage = React.lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = React.lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const ActivatePage = React.lazy(() =>
  import('./pages/ActivatePage').then((m) => ({ default: m.ActivatePage })),
);
const ForgotPasswordPage = React.lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = React.lazy(() =>
  import('./pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);
const ProfilePage = React.lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const PreferencesPage = React.lazy(() =>
  import('./pages/PreferencesPage').then((m) => ({ default: m.PreferencesPage })),
);
const ProjectsPage = React.lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })),
);
const KanbanBoardPage = React.lazy(() =>
  import('./pages/KanbanBoardPage').then((m) => ({ default: m.KanbanBoardPage })),
);
const BacklogPage = React.lazy(() =>
  import('./pages/BacklogPage').then((m) => ({ default: m.BacklogPage })),
);
const IssueDetailPage = React.lazy(() =>
  import('./pages/IssueDetailPage').then((m) => ({ default: m.IssueDetailPage })),
);
const AdvancedSearchPage = React.lazy(() =>
  import('./pages/AdvancedSearchPage').then((m) => ({ default: m.AdvancedSearchPage })),
);
const TimeTrackingPage = React.lazy(() =>
  import('./pages/TimeTrackingPage').then((m) => ({ default: m.TimeTrackingPage })),
);
const AdminDashboardPage = React.lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminRbacPage = React.lazy(() =>
  import('./pages/AdminRbacPage').then((m) => ({ default: m.AdminRbacPage })),
);
const ProjectSettingsPage = React.lazy(() =>
  import('./pages/ProjectSettingsPage').then((m) => ({ default: m.ProjectSettingsPage })),
);
const OAuthCallbackPage = React.lazy(() =>
  import('./pages/OAuthCallbackPage').then((m) => ({ default: m.OAuthCallbackPage })),
);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const { toggleMobile } = useSidebar();

  if (loading) {
    return <PageSkeletonLoader />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-background)] transition-colors duration-200 select-none">
      {/* ─── Full-Height Super-Sidebar (y=0 to y=100vh) ────────────────────── */}
      <Sidebar />

      {/* ─── Right Workspace Column: Control Strip (Authed) + Floating Canvas Card ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {user && <WorkspaceHeader />}

        {/* ─── Elevated Main Canvas Card (Optical Curve Metaphor) ──────────── */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 min-w-0 overflow-y-auto overflow-x-hidden mx-1 mb-1 sm:mx-2 sm:mb-2 md:mr-3 md:mb-3 md:mx-0 bg-[var(--md-sys-color-background)] rounded-xl sm:rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)]/25 shadow-xs transition-all duration-200 flex flex-col ${
            !user ? 'mt-1 sm:mt-2 md:mt-3' : ''
          }`}
        >
          {/* Mobile Top Strip for Guest Navigation (md:hidden) */}
          {!user && (
            <div className="md:hidden sticky top-0 z-30 px-4 h-14 shrink-0 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/15 bg-[var(--md-sys-color-surface-container-low)]/90 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-tight text-[var(--md-sys-color-on-surface)]">
                  BugTracker
                </span>
              </div>
              <button
                type="button"
                onClick={toggleMobile}
                className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/20 shadow-2xs"
                aria-label="Open navigation menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col">{children}</div>

          {!user && <Footer />}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout>
          <React.Suspense fallback={<PageSkeletonLoader />}>
            <Routes>
              {/* Public & Guest-Only Routes */}
              <Route path="/" element={<HomePage />} />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/activate" element={<ActivatePage />} />
              <Route
                path="/forgot-password"
                element={
                  <PublicOnlyRoute>
                    <ForgotPasswordPage />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/reset-password"
                element={
                  <PublicOnlyRoute>
                    <ResetPasswordPage />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

              {/* Protected Workspace & Board Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board"
                element={
                  <ProtectedRoute>
                    <KanbanBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/board"
                element={
                  <ProtectedRoute>
                    <KanbanBoardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backlog"
                element={
                  <ProtectedRoute>
                    <BacklogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/backlog"
                element={
                  <ProtectedRoute>
                    <BacklogPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/issues/:key"
                element={
                  <ProtectedRoute>
                    <IssueDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <AdvancedSearchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/time-tracking"
                element={
                  <ProtectedRoute>
                    <TimeTrackingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferences"
                element={
                  <ProtectedRoute>
                    <PreferencesPage />
                  </ProtectedRoute>
                }
              />

              {/* Project Settings / People */}
              <Route
                path="/projects/:id/settings"
                element={
                  <ProtectedRoute>
                    <ProjectSettingsPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Console Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage defaultTab="users" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboardPage defaultTab="users" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/rbac"
                element={
                  <AdminRoute>
                    <AdminDashboardPage defaultTab="rbac" />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/security-logs"
                element={
                  <AdminRoute>
                    <AdminDashboardPage defaultTab="security" />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </AppLayout>
        <SessionExpiredModal />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
